import { lockQuestionsForRoom, clearRoomQuestions } from '../services/question.service.js';
import { getLeaderboard, persistFinalScores, allPlayersAnswered, recordQuestionSentAt } from '../services/score.service.js';
import { updateRoomStatus, cleanupRoom } from '../services/room.service.js';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { sleep } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// GAME PHASES
export const PHASE = {
  WAITING:   'waiting',
  STARTING:  'starting',
  QUESTION:  'question',
  REVEAL:    'reveal',
  FINISHED:  'finished',
};

const REVEAL_DURATION_MS  = 3000;  // 3s to show correct answer before next Q
const QUESTION_TIME_MS    = env.QUESTION_TIME_LIMIT_SECONDS * 1000;

/**
 * Starts a game for the given room.
 * - Locks questions in Redis
 * - Creates a game_session in Supabase
 * - Begins the question loop
 */
export async function startGame(io, room) {
  const { id: roomId, code, topics, questionCount, difficulty } = room;
  const socketRoom = `room:${roomId}`;

  try {
    // Lock questions — all players will receive the same set
    const questions = await lockQuestionsForRoom(roomId, topics, questionCount, difficulty);

    // Create game session in Supabase
    const { data: session, error } = await supabaseAdmin
      .from('game_sessions')
      .insert({ room_id: roomId, topics, questions, started_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw new Error(`Failed to create game session: ${error.message}`);

    await updateRoomStatus(roomId, PHASE.STARTING);

    // Notify all players: game is starting
    io.to(socketRoom).emit('game:starting', {
      totalQuestions: questions.length,
      questionTime:   env.QUESTION_TIME_LIMIT_SECONDS,
      topics,
    });

    await sleep(3000); // 3s countdown before first question

    // ── Question loop ──────────────────────────────────────────────
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      await updateRoomStatus(roomId, PHASE.QUESTION);

      // Record the authoritative broadcast time BEFORE emitting, so no
      // client can ever compute a "time remaining" larger than what the
      // server itself will use to score their answer.
      await recordQuestionSentAt(roomId, i);

      // Send question WITHOUT the correct answer
      io.to(socketRoom).emit('game:question', {
        index:          i,
        total:          questions.length,
        question:       q.question,
        options:        q.options,
        topic:          q.topic,
        difficulty:     q.difficulty,
        timeLimitMs:    QUESTION_TIME_MS,
      });

      // Wait for time limit or all players answering
      await waitForAnswers(io, socketRoom, roomId, i, QUESTION_TIME_MS);

      // ── Reveal phase ─────────────────────────────────────────────
      const leaderboard = await getLeaderboard(roomId);
      io.to(socketRoom).emit('game:reveal', {
        index:       i,
        correct:     q.correct,
        explanation: q.explanation,
        leaderboard,
      });

      await sleep(REVEAL_DURATION_MS);

      // Broadcast score update
      io.to(socketRoom).emit('game:score_update', { leaderboard });
    }

    // ── Game finished ─────────────────────────────────────────────
    await updateRoomStatus(roomId, PHASE.FINISHED);
    const finalLeaderboard = await persistFinalScores(roomId, session.id);

    // Mark the session ended and drop the stored question snapshot — it
    // was only ever needed while the game was live (Redis already serves
    // that during play). Leaving it in Supabase permanently is what fills
    // a free-tier DB fastest, since every game writes a full JSON copy of
    // its questions; nulling it here keeps the lightweight session/score
    // history (used for the leaderboard and game history endpoints) while
    // discarding the heavy part the moment it's no longer needed.
    await supabaseAdmin
      .from('game_sessions')
      .update({ ended_at: new Date().toISOString(), questions: null })
      .eq('id', session.id);

    io.to(socketRoom).emit('game:finished', { leaderboard: finalLeaderboard });

    // Cleanup Redis state
    await clearRoomQuestions(roomId);
    await cleanupRoom(roomId, code);

    logger.info(`Game finished in room ${code}: ${questions.length} questions, ${finalLeaderboard.length} players`);
  } catch (err) {
    logger.error(`Game engine error in room ${room.code}:`, err.message);
    io.to(socketRoom).emit('game:error', { message: 'Game encountered an error. Please try again.' });
    await updateRoomStatus(roomId, PHASE.WAITING);
  }
}

/**
 * Waits until either the time limit expires or all players have answered.
 * Resolves early if all answers are in.
 */
async function waitForAnswers(io, socketRoom, roomId, questionIndex, timeLimitMs) {
  const pollInterval = 500; // check every 500ms
  let elapsed = 0;

  while (elapsed < timeLimitMs) {
    await sleep(pollInterval);
    elapsed += pollInterval;

    const done = await allPlayersAnswered(roomId, questionIndex);
    if (done) {
      logger.debug(`All players answered Q${questionIndex} in room ${roomId} — advancing early`);
      break;
    }

    // Emit time tick so clients can sync their timers
    io.to(socketRoom).emit('game:tick', {
      questionIndex,
      remainingMs: Math.max(0, timeLimitMs - elapsed),
    });
  }
}
