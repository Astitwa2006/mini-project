import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { SOCKET_EVENTS, FORMAT_LABELS } from '../utils/constants.js';
import { ordinal, longestStreak } from '../utils/helpers.js';

const AVATAR_COLORS = ['bg-accent', 'bg-danger', 'bg-[#EDEAE3]', 'bg-[#8FD6FF]', 'bg-[#E8E4DA]'];

export default function ResultsPage() {
  const { leaderboard, room, history, dispatch } = useGame();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { createRoom } = useGameSocket();
  const navigate = useNavigate();
  const [rematching, setRematching] = useState(false);

  const myResult = leaderboard.find((p) => p.id === user?.id);

  // Get top 3 for podium
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  const played = history.length;
  const hits = history.filter((h) => h.correct).length;
  const timedEntries = history.filter((h) => h.secs != null);
  const avgSpeed = timedEntries.length
    ? `${(timedEntries.reduce((n, h) => n + h.secs, 0) / timedEntries.length).toFixed(1)}s`
    : '—';
  const missed = history.filter((h) => !h.correct);

  function handleRematch() {
    if (!room || rematching) return;
    setRematching(true);
    createRoom({
      topics: room.topics, questionCount: room.questionCount, difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 8, questionTimeSeconds: room.questionTimeSeconds,
    });
    socket.once(SOCKET_EVENTS.ROOM_CREATED, (roomData) => {
      dispatch({ type: 'SET_ROOM', payload: roomData });
      navigate(`/room/${roomData.roomId}`);
    });
    socket.once(SOCKET_EVENTS.ERROR, ({ message }) => {
      alert(message);
      setRematching(false);
    });
  }

  return (
    <div className="min-h-screen box-border bg-bg text-text flex flex-col font-sans">
      <div className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-[22px] pt-[62px] pb-[44px] gap-[16px]">

      <div className="flex flex-col gap-1">
        <span className="font-mono font-medium text-[10px] tracking-[0.16em] text-text-muted uppercase">
          ROOM {room?.code} · {room?.questionCount || 10} QUESTIONS
        </span>
        <h2 className="m-0 font-bold text-[34px] leading-[1.05] tracking-[-0.03em]">
          You came <span className="text-surface-inverted dark:text-accent">{ordinal(myResult?.rank || 1)}</span>
        </h2>
      </div>

      {/* Podium */}
      <div className="flex items-end gap-[10px] h-[210px] mt-2">
        {/* 2nd Place */}
        {second ? (
          <div className="flex-1 flex flex-col items-center gap-[8px]">
            <div className={`w-[38px] h-[38px] rounded-[11px] ${AVATAR_COLORS[1]} text-[#0B0D10] border border-border-heavy flex items-center justify-center font-bold text-[14px]`}>
              {second.username?.substring(0,2).toUpperCase() || 'P2'}
            </div>
            <div className="w-full h-[118px] rounded-t-[12px] bg-gradient-to-b from-accent/40 to-accent/[0.08] border border-accent/35 border-b-0 flex flex-col items-center justify-start pt-[12px] gap-[2px]">
              <span className="font-mono font-bold text-[20px] text-text">2</span>
              <span className="font-mono font-medium text-[12px] text-text-muted">{second.score.toLocaleString()}</span>
            </div>
          </div>
        ) : <div className="flex-1" />}

        {/* 1st Place */}
        {first && (
          <div className="flex-1 flex flex-col items-center gap-[8px]">
            <div className="w-[18px] h-[18px] text-[18px] mb-[-4px]">👑</div>
            <div className={`w-[38px] h-[38px] rounded-[11px] ${AVATAR_COLORS[0]} text-[#0B0D10] border border-border-heavy flex items-center justify-center font-bold text-[14px]`}>
              {first.username?.substring(0,2).toUpperCase() || 'P1'}
            </div>
            <div className="w-full h-[150px] rounded-t-[12px] bg-gradient-to-b from-accent/70 to-accent/[0.15] border border-accent/60 border-b-0 flex flex-col items-center justify-start pt-[12px] gap-[2px]">
              <span className="font-mono font-bold text-[20px] text-text">1</span>
              <span className="font-mono font-medium text-[12px] text-text-muted">{first.score.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third ? (
          <div className="flex-1 flex flex-col items-center gap-[8px]">
            <div className={`w-[38px] h-[38px] rounded-[11px] ${AVATAR_COLORS[2]} text-[#0B0D10] border border-border-heavy flex items-center justify-center font-bold text-[14px]`}>
              {third.username?.substring(0,2).toUpperCase() || 'P3'}
            </div>
            <div className="w-full h-[90px] rounded-t-[12px] bg-gradient-to-b from-accent/20 to-accent/[0.05] border border-accent/20 border-b-0 flex flex-col items-center justify-start pt-[12px] gap-[2px]">
              <span className="font-mono font-bold text-[20px] text-text">3</span>
              <span className="font-mono font-medium text-[12px] text-text-muted">{third.score.toLocaleString()}</span>
            </div>
          </div>
        ) : <div className="flex-1" />}
      </div>

      {/* Stat tiles */}
      {played > 0 && (
        <div className="flex gap-2.5">
          <div className="flex-1 border border-border rounded-xl p-3 flex flex-col gap-0.5 bg-surface-base">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">ACCURACY</span>
            <span className="font-bold text-[19px]">{hits}/{played}</span>
          </div>
          <div className="flex-1 border border-border rounded-xl p-3 flex flex-col gap-0.5 bg-surface-base">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">AVG SPEED</span>
            <span className="font-bold text-[19px]">{avgSpeed}</span>
          </div>
          <div className="flex-1 border border-border rounded-xl p-3 flex flex-col gap-0.5 bg-surface-base">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">BEST STREAK</span>
            <span className="font-bold text-[19px]">×{longestStreak(history)}</span>
          </div>
        </div>
      )}

      {/* You missed */}
      {missed.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-mono font-medium text-[10px] tracking-[0.14em] text-text-muted">YOU MISSED</span>
          {missed.slice(0, 3).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 border border-danger/40 bg-danger/[0.07] rounded-xl px-3.5 py-3"
            >
              <span className="font-mono font-medium text-[11px] text-danger shrink-0">{FORMAT_LABELS[m.type] || m.type}</span>
              <span className="flex-1 font-normal text-[13px] leading-[1.35] text-text/80 text-balance">{m.question}</span>
            </motion.div>
          ))}
          {missed.length > 3 && (
            <span className="font-normal text-[12px] text-text-muted">+{missed.length - 3} more</span>
          )}
        </div>
      )}

      <div className="flex-1 min-h-[16px]"></div>

      <div className="flex gap-2.5">
        <button
          onClick={handleRematch}
          disabled={rematching}
          className="flex-1 h-[54px] rounded-[14px] bg-accent text-[#14161A] flex items-center justify-center font-semibold text-[16px] disabled:opacity-60 hover:opacity-90 transition-all"
        >
          {rematching ? 'Creating…' : 'Rematch'}
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="flex-1 h-[54px] rounded-[14px] border border-border-heavy flex items-center justify-center font-semibold text-[16px] text-text hover:bg-surface-alt transition-all"
        >
          Your stats
        </button>
      </div>
      </div>
    </div>
  );
}
