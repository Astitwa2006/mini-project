import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { GAME_PHASE } from '../utils/constants.js';
import { TOPICS } from '../utils/constants.js';
import CountdownTimer from '../components/game/CountdownTimer.jsx';
import AnswerOptions from '../components/game/AnswerOptions.jsx';
import TopicBadge from '../components/game/TopicBadge.jsx';
import AnswerFeedback from '../components/game/AnswerFeedback.jsx';
import LiveLeaderboard from '../components/scoreboard/LiveLeaderboard.jsx';
import { useNavigate } from 'react-router-dom';

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    phase, room, currentQuestion, myAnswer, reveal, leaderboard, chat,
    totalQuestions, questionTime,
  } = useGame();

  const { submitAnswer, sendChat } = useGameSocket();
  const [chatInput, setChatInput] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Start timer when new question arrives
  const handleTimerStart = useCallback(() => {
    setTimerRunning(true);
    setStartTime(Date.now());
  }, []);

  const handleAnswer = useCallback((letter) => {
    if (myAnswer || !currentQuestion) return;
    const timeRemainingMs = Math.max(0, questionTime * 1000 - (Date.now() - startTime));
    submitAnswer(currentQuestion.index, letter, timeRemainingMs);
    setTimerRunning(false);
  }, [myAnswer, currentQuestion, questionTime, startTime, submitAnswer]);

  const handleTimerExpire = useCallback(() => {
    setTimerRunning(false);
  }, []);

  // Navigate to results when finished
  if (phase === GAME_PHASE.FINISHED && room) {
    navigate(`/results/${room.id}`, { replace: true });
    return null;
  }

  const topicMeta = currentQuestion ? TOPICS[currentQuestion.topic] : null;

  return (
    <div className="min-h-screen animated-bg flex gap-0">
      {/* ── Main game area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">

        {/* Starting screen */}
        {phase === GAME_PHASE.STARTING && (
          <motion.div
            className="text-center space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="text-8xl">🚀</div>
            <h1 className="text-4xl font-black font-display gradient-text">Get Ready!</h1>
            <p className="text-slate-400">{totalQuestions} questions · {questionTime}s each</p>
          </motion.div>
        )}

        {/* Question */}
        {(phase === GAME_PHASE.QUESTION || phase === GAME_PHASE.REVEAL) && currentQuestion && (
          <div className="w-full max-w-2xl space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Q {currentQuestion.index + 1}/{totalQuestions}
                </span>
                {topicMeta && (
                  <TopicBadge topicSlug={currentQuestion.topic} />
                )}
              </div>
              <CountdownTimer
                timeLimitMs={questionTime * 1000}
                running={timerRunning && phase === GAME_PHASE.QUESTION}
                onExpire={handleTimerExpire}
                questionIndex={currentQuestion.index}
              />
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion.index) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="glass rounded-2xl p-6 space-y-6"
                onAnimationComplete={handleTimerStart}
              >
                <h2 className="text-xl font-bold text-white leading-snug">
                  {currentQuestion.question}
                </h2>

                <AnswerOptions
                  options={currentQuestion.options}
                  onSelect={handleAnswer}
                  selectedOption={myAnswer?.selectedOption}
                  correctAnswer={reveal?.correct}
                  revealed={phase === GAME_PHASE.REVEAL}
                  disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
                />

                {/* My result popup */}
                <AnswerFeedback 
                  show={!!myAnswer} 
                  isCorrect={myAnswer?.isCorrect} 
                  points={myAnswer?.points} 
                />

                {/* Explanation on reveal */}
                <AnimatePresence>
                  {reveal?.explanation && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-sm text-slate-400 border-t border-white/10 pt-4"
                    >
                      💡 {reveal.explanation}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Right sidebar: leaderboard + chat ──────────────────────── */}
      <div className="w-80 hidden lg:flex flex-col border-l border-white/5 bg-black/20">
        {/* Leaderboard */}
        <div className="p-4 border-b border-white/5">
          <LiveLeaderboard leaderboard={leaderboard} myId={user?.id} />
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {chat.map((msg) => (
              <div key={msg.id} className="text-xs">
                <span className="text-violet-400 font-semibold">{msg.username}: </span>
                <span className="text-slate-300">{msg.message}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  sendChat(chatInput.trim());
                  setChatInput('');
                }
              }}
              placeholder="Say something..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                         placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
