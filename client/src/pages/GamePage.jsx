import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { GAME_PHASE } from '../utils/constants.js';
import CountdownTimer from '../components/game/CountdownTimer.jsx';
import AnswerOptions from '../components/game/AnswerOptions.jsx';
import { useNavigate } from 'react-router-dom';

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    phase, room, currentQuestion, myAnswer, reveal,
    totalQuestions, questionTime,
  } = useGame();

  const { submitAnswer } = useGameSocket();
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

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

  if (phase === GAME_PHASE.FINISHED && room) {
    navigate(`/results/${room.id}`, { replace: true });
    return null;
  }

  // Find my current score
  const myScore = room?.players?.find(p => p.id === user?.id)?.score || 0;

  return (
    <div className="min-h-screen box-border px-[22px] pt-[66px] pb-[44px] bg-bg text-text flex flex-col gap-4 font-sans dark max-w-md mx-auto">
      {/* Starting screen */}
      {phase === GAME_PHASE.STARTING && (
        <motion.div
          className="flex-1 flex flex-col items-center justify-center text-center gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="text-[80px]">🚀</div>
          <h1 className="font-bold text-4xl text-white">Get Ready!</h1>
          <p className="font-medium text-[#EDEAE3]/60">{totalQuestions} questions · {questionTime}s each</p>
        </motion.div>
      )}

      {/* Question */}
      {(phase === GAME_PHASE.QUESTION || phase === GAME_PHASE.REVEAL) && currentQuestion && (
        <>
          {/* Top Bar (Progress) */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono font-medium text-[11px] tracking-[0.1em] text-[#EDEAE3]/45 whitespace-nowrap">
              Q{currentQuestion.index + 1} / {totalQuestions}
            </span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-[#EDEAE3]/55 rounded-full"
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
                {myAnswer.points > 0 ? `+${myAnswer.points}` : '0'}
              </span>
              <span className="font-medium text-[13px] opacity-70">
                {myAnswer.isCorrect ? 'Great speed' : 'Better luck next time'}
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
                <span className="font-normal text-[12.5px] leading-[1.4] text-[#EDEAE3]/55 max-w-[200px]">
                  Generated from real-time topic feeds
                </span>
              </div>
            </div>
          )}

          {/* Question Text */}
          <h2 className="m-0 mt-1.5 font-semibold text-[27px] leading-[1.2] tracking-[-0.02em] text-balance">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <motion.div onAnimationComplete={handleTimerStart}>
            <AnswerOptions
              options={currentQuestion.options}
              onSelect={handleAnswer}
              selectedOption={myAnswer?.selectedOption}
              correctAnswer={reveal?.correct}
              revealed={phase === GAME_PHASE.REVEAL}
              disabled={!!myAnswer || phase === GAME_PHASE.REVEAL}
            />
          </motion.div>

          <div className="flex-1 min-h-[10px]"></div>

          {/* Bottom Bar: Answers in (if not reveal) */}
          {phase === GAME_PHASE.QUESTION && (
            <div className="border-t border-white/10 pt-3.5 flex items-center gap-2.5">
              <span className="font-normal text-[12.5px] text-[#EDEAE3]/50">
                Waiting for players to answer...
              </span>
            </div>
          )}

          {/* Reveal Source Article Box (if reveal) */}
          {phase === GAME_PHASE.REVEAL && reveal?.explanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-white/10 rounded-[16px] overflow-hidden bg-white/5 mt-2"
            >
              <div className="p-4 flex flex-col gap-2">
                <span className="font-mono font-medium text-[10px] tracking-[0.14em] text-danger">
                  WHY THIS ANSWER
                </span>
                <span className="font-normal text-[14px] leading-[1.5] text-[#EDEAE3]/80 text-balance">
                  {reveal.explanation}
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
