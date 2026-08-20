import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { GAME_PHASE, TILE_COLORS } from '../utils/constants.js';
import CountdownTimer from '../components/game/CountdownTimer.jsx';
import AnswerOptions from '../components/game/AnswerOptions.jsx';
import AnswerMulti from '../components/game/AnswerMulti.jsx';
import AnswerRank from '../components/game/AnswerRank.jsx';
import AnswerSwipe from '../components/game/AnswerSwipe.jsx';
import AnswerTypeIn from '../components/game/AnswerTypeIn.jsx';
import { useNavigate } from 'react-router-dom';

function StandingsScreen({ room, leaderboard, myId }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col gap-[18px]"
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono font-medium text-[10px] tracking-[0.16em] text-text-muted uppercase">
          Halfway · Room {room?.code}
        </span>
        <h2 className="m-0 font-bold text-[30px] leading-[1.08] tracking-[-0.03em]">Standings</h2>
      </div>

      <div className="flex flex-col gap-2">
        {leaderboard.map((p, i) => {
          const isMe = p.id === myId;
          const tile = p.tileColor || TILE_COLORS[i % TILE_COLORS.length];
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 border ${isMe ? 'bg-surface-inverted text-text-inverted border-surface-inverted' : 'bg-surface-base border-border'}`}
            >
              <span className={`font-mono font-bold text-[13px] w-4 ${isMe ? 'opacity-60' : 'text-text-muted opacity-60'}`}>{p.rank}</span>
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-[12px] text-[#14161A]" style={{ background: tile }}>
                {(p.username || '??').slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 font-semibold text-[15px]">{p.username}{isMe ? ' (you)' : ''}</span>
              <span className="font-mono font-bold text-[14px]">{p.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-[10px]" />
      <div className="flex items-center justify-center gap-2 text-text-muted text-[13px] font-medium pb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        Next question soon…
      </div>
    </motion.div>
  );
}

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    phase, room, currentQuestion, myAnswer, reveal,
    totalQuestions, questionTime, leaderboard, isHalfway,
  } = useGame();

  const { submitAnswer } = useGameSocket();
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Modifiers
  const [wager, setWager] = useState(false);
  const [stealTarget, setStealTarget] = useState(null);
  const [stealPickerOpen, setStealPickerOpen] = useState(false);
  const [stealUsed, setStealUsed] = useState(false);

  // Wager/steal-target choices are per-question — clear them the moment a
  // new question arrives instead of letting a stale choice silently carry
  // into the next round.
  useEffect(() => {
    setWager(false);
    setStealTarget(null);
    setStealPickerOpen(false);
  }, [currentQuestion?.index]);

  // Each player only gets one steal for the whole game (enforced
  // server-side) — once we see it register, stop offering the button.
  useEffect(() => {
    if (myAnswer?.stealArmed) setStealUsed(true);
  }, [myAnswer?.stealArmed]);

  const handleTimerStart = useCallback(() => {
    setTimerRunning(true);
    setStartTime(Date.now());
  }, []);

  const handleAnswer = useCallback((answerValue) => {
    if (myAnswer || !currentQuestion) return;
    const timeRemainingMs = Math.max(0, questionTime * 1000 - (Date.now() - startTime));
    submitAnswer(currentQuestion.index, answerValue, timeRemainingMs, wager, stealTarget);
    setTimerRunning(false);
  }, [myAnswer, currentQuestion, questionTime, startTime, submitAnswer, wager, stealTarget]);

  const handleTimerExpire = useCallback(() => {
    setTimerRunning(false);
  }, []);

  if (phase === GAME_PHASE.FINISHED && room) {
    navigate(`/results/${room.id}`, { replace: true });
    return null;
  }

  // Find my current score
  const myScore = room?.players?.find(p => p.id === user?.id)?.score || 0;
  const opponents = (room?.players || []).filter(p => p.id !== user?.id);

  return (
    <div className="min-h-screen box-border bg-bg text-text flex flex-col font-sans">
      <div className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-[22px] pt-[66px] pb-[44px] gap-4">
      {/* Starting screen */}
      {phase === GAME_PHASE.STARTING && (
        <motion.div
          className="flex-1 flex flex-col items-center justify-center text-center gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="text-[80px]">🚀</div>
          <h1 className="font-bold text-4xl text-text">Get Ready!</h1>
          <p className="font-medium text-text-muted">{totalQuestions} questions · {questionTime}s each</p>
        </motion.div>
      )}

      {/* Halfway standings interlude — takes over the reveal window once the server flags it */}
      {phase === GAME_PHASE.REVEAL && isHalfway && (
        <StandingsScreen room={room} leaderboard={leaderboard} myId={user?.id} />
      )}

      {/* Question */}
      {(phase === GAME_PHASE.QUESTION || (phase === GAME_PHASE.REVEAL && !isHalfway)) && currentQuestion && (
        <>
          {/* Top Bar (Progress) */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono font-medium text-[11px] tracking-[0.1em] text-text-muted whitespace-nowrap">
              Q{currentQuestion.index + 1} / {totalQuestions}
            </span>
            <div className="flex-1 h-1 rounded-full bg-surface-alt border border-border overflow-hidden">
              <motion.div
                className="h-full bg-surface-inverted/50 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion.index) / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="font-mono font-medium text-[11px] text-accent whitespace-nowrap">
              {myScore.toLocaleString()} pts
            </span>
          </div>

          {/* Reveal feedback banner (if phase === REVEAL) */}
          {phase === GAME_PHASE.REVEAL && myAnswer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[18px] p-[22px] flex flex-col gap-1.5 ${myAnswer.isCorrect ? 'bg-accent text-[#0B0D10]' : 'bg-danger text-[#0B0D10]'}`}
            >
              <span className="font-mono font-bold text-[11px] tracking-[0.16em] opacity-65">
                {myAnswer.isCorrect ? 'CORRECT' : 'INCORRECT'}
              </span>
              <span className="font-bold text-[40px] leading-none tracking-[-0.03em]">
                {myAnswer.points > 0 ? `+${myAnswer.points}` : myAnswer.points}
              </span>
              <span className="font-medium text-[13px] opacity-70">
                {myAnswer.wager && (myAnswer.isCorrect ? 'Wager doubled' : 'Wager lost')}
                {!myAnswer.wager && (myAnswer.isCorrect ? 'Great speed' : 'Better luck next time')}
                {myAnswer.stealArmed && ' · steal attempted — check the leaderboard'}
              </span>
            </motion.div>
          )}

          {/* Timer and Meta (hide in reveal) */}
          {phase === GAME_PHASE.QUESTION && (
            <div className="flex items-center gap-4 mt-2">
              <CountdownTimer
                timeLimitMs={questionTime * 1000}
                running={timerRunning && phase === GAME_PHASE.QUESTION}
                onExpire={handleTimerExpire}
                questionIndex={currentQuestion.index}
              />
              <div className="flex flex-col gap-1.5">
                <span className="font-mono font-medium text-[10px] tracking-[0.14em] text-danger uppercase">
                  Sourced {currentQuestion.topic}
                </span>
                <span className="font-normal text-[12.5px] leading-[1.4] text-text-muted max-w-[200px]">
                  Generated from real-time topic feeds
                </span>
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="flex items-start justify-between gap-3 mt-1.5">
            <h2 className="m-0 font-semibold text-[27px] leading-[1.2] tracking-[-0.02em] text-balance">
              {currentQuestion.question}
            </h2>
            {/* Type badge */}
            <span className="shrink-0 font-mono font-bold text-[10px] tracking-[0.1em] text-text-muted border border-border-heavy rounded-md px-1.5 py-0.5 uppercase">
              {currentQuestion.type || 'single'}
            </span>
          </div>

          {/* Modifiers (Wager & Steal) */}
          {phase === GAME_PHASE.QUESTION && !myAnswer && (
             <div className="flex flex-col gap-2 mt-2 mb-2">
               <div className="flex gap-2">
                  <button
                    onClick={() => setWager(!wager)}
                    className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-medium text-[13px] transition-colors ${wager ? 'bg-[#FF7A66] text-[#14161A] border-[#FF7A66]' : 'bg-transparent text-text border-border-heavy hover:bg-surface-alt'}`}
                  >
                    <span className="font-mono text-[10px] opacity-60">WAGER</span> 2× / lose it
                  </button>
                  {opponents.length > 0 && (
                    <button
                      onClick={() => stealUsed ? null : (stealTarget ? setStealTarget(null) : setStealPickerOpen(o => !o))}
                      disabled={stealUsed}
                      className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-medium text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${stealTarget ? 'bg-[#C8FF4D] text-[#14161A] border-[#C8FF4D]' : 'bg-transparent text-text border-border-heavy hover:bg-surface-alt'}`}
                    >
                      <span className="font-mono text-[10px] opacity-60">STEAL</span>
                      {stealUsed ? 'used' : (stealTarget ? opponents.find(p => p.id === stealTarget)?.username : '×1')}
                    </button>
                  )}
               </div>
               <AnimatePresence>
                 {stealPickerOpen && !stealTarget && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="flex flex-wrap gap-2 overflow-hidden"
                   >
                     {opponents.map(p => (
                       <button
                         key={p.id}
                         onClick={() => { setStealTarget(p.id); setStealPickerOpen(false); }}
                         className="px-3 py-2 rounded-lg border border-border-heavy text-[13px] font-medium hover:bg-surface-alt transition-colors"
                       >
                         Steal from {p.username}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          )}

          {/* Options */}
          <motion.div onAnimationComplete={handleTimerStart}>
            {(!currentQuestion.type || currentQuestion.type === 'single') && (
              <AnswerOptions
                options={currentQuestion.options}
                onSelect={handleAnswer}
                selectedOption={myAnswer?.selectedOption}
                correctAnswer={reveal?.correct}
                revealed={phase === GAME_PHASE.REVEAL}
                disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
              />
            )}
            {currentQuestion.type === 'multi' && (
              <AnswerMulti
                options={currentQuestion.options}
                onSelect={handleAnswer}
                selectedOptions={myAnswer?.selectedOption}
                correctAnswer={reveal?.correct}
                revealed={phase === GAME_PHASE.REVEAL}
                disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
              />
            )}
            {currentQuestion.type === 'rank' && (
              <AnswerRank
                options={currentQuestion.options}
                onSelect={handleAnswer}
                selectedOrder={myAnswer?.selectedOption}
                correctAnswer={reveal?.correct}
                revealed={phase === GAME_PHASE.REVEAL}
                disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
              />
            )}
            {currentQuestion.type === 'swipe' && (
              <AnswerSwipe
                options={currentQuestion.options}
                onSelect={handleAnswer}
                selectedOption={myAnswer?.selectedOption}
                correctAnswer={reveal?.correct}
                revealed={phase === GAME_PHASE.REVEAL}
                disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
              />
            )}
            {currentQuestion.type === 'type-in' && (
              <AnswerTypeIn
                onSelect={handleAnswer}
                selectedOption={myAnswer?.selectedOption}
                correctAnswer={reveal?.correct}
                revealed={phase === GAME_PHASE.REVEAL}
                disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
              />
            )}
          </motion.div>

          <div className="flex-1 min-h-[10px]"></div>

          {/* Bottom Bar: Answers in (if not reveal) */}
          {phase === GAME_PHASE.QUESTION && (
            <div className="border-t border-border pt-3.5 flex items-center gap-2.5">
              <span className="font-normal text-[12.5px] text-text-muted">
                Waiting for players to answer...
              </span>
            </div>
          )}

          {/* Reveal Source Article Box (if reveal) */}
          {phase === GAME_PHASE.REVEAL && reveal?.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border-heavy rounded-[16px] overflow-hidden bg-surface-alt mt-2"
            >
              <div className="p-4 flex flex-col gap-2">
                <span className="font-mono font-medium text-[10px] tracking-[0.14em] text-danger">
                  WHY THIS ANSWER
                </span>
                <span className="font-normal text-[14px] leading-[1.5] text-text text-balance">
                  {reveal.explanation}
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
