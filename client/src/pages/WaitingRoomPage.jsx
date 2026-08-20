import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { GAME_PHASE } from '../utils/constants.js';
import { buildShareUrl } from '../utils/helpers.js';

const AVATAR_COLORS = ['bg-accent', 'bg-danger', 'bg-[#EDEAE3]', 'bg-[#8FD6FF]', 'bg-[#E8E4DA]'];

export default function WaitingRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, phase } = useGame();
  const { startGame, leaveRoom } = useGameSocket();

  const isHost = room?.hostId === user?.id;
  const hostPlayer = room?.players?.find(p => p.id === room.hostId);

  useEffect(() => {
    if (phase === GAME_PHASE.STARTING) {
      navigate(`/game/${id}`, { replace: true });
    }
  }, [phase, id, navigate]);

  if (!room) return null;

  const shareUrl = room.shareUrl || buildShareUrl(room.code);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="min-h-screen box-border px-[22px] pt-[66px] pb-[44px] bg-bg text-text flex flex-col gap-5 font-sans dark max-w-md mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => { leaveRoom(); navigate('/lobby'); }}
          className="font-medium text-[13px] text-[#EDEAE3]/50 hover:text-white transition-colors cursor-pointer"
        >
          ← Leave
        </button>
        <span className="font-mono font-medium text-[11px] tracking-[0.1em] text-[#EDEAE3]/40">
          HOST: {hostPlayer?.username || 'unknown'}
        </span>
      </div>

      {/* Code Box */}
      <div className="rounded-2xl bg-gradient-to-br from-[#C8FF4D]/10 to-transparent border border-[#C8FF4D]/30 p-5">
        <span className="font-mono font-medium text-[10px] tracking-[0.14em] text-[#EDEAE3]/50">
          ROOM CODE
        </span>
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono font-bold text-[42px] leading-none tracking-[0.08em] text-accent">
            {room.code}
          </span>
          <button 
            onClick={handleCopyLink}
            className="font-medium text-xs text-[#EDEAE3]/60 border border-white/20 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
          >
            Copy link
          </button>
        </div>
      </div>

      {/* Settings Pills */}
      <div className="flex gap-2 flex-wrap">
        <span className="font-mono font-medium text-[11px] text-[#EDEAE3]/75 bg-white/5 rounded-full px-3 py-1.5">
          {room.questionCount} questions
        </span>
        <span className="font-mono font-medium text-[11px] text-[#EDEAE3]/75 bg-white/5 rounded-full px-3 py-1.5">
          10s each
        </span>
        <span className="font-mono font-medium text-[11px] text-[#0B0D10] bg-danger rounded-full px-3 py-1.5">
          {room.topics?.[0] || 'Any'}
        </span>
      </div>

      {/* Players List */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-semibold text-[15px]">In the room</span>
          <span className="font-mono font-medium text-[12px] text-[#EDEAE3]/45">
            {room.players?.length || 0} / {room.maxPlayers}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {room.players?.map((p, i) => {
            const isMe = p.id === user?.id;
            const pHost = p.id === room.hostId;
            const initials = p.username ? p.username.substring(0, 2).toUpperCase() : '??';
            const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
            
            return (
              <div key={p.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-3">
                <div className={`w-[34px] h-[34px] rounded-[10px] ${colorClass} text-[#0B0D10] flex items-center justify-center font-bold text-sm`}>
                  {initials}
                </div>
                <span className="flex-1 font-medium text-[15px]">
                  {p.username || 'Guest'}
                  {pHost && <span className="ml-2 font-mono font-medium text-[10px] text-[#EDEAE3]/45 tracking-[0.08em]">HOST</span>}
                </span>
                <span className="font-mono font-medium text-[11px] text-accent">
                  READY
                </span>
              </div>
            );
          })}

          {/* Waiting slot */}
          {(room.players?.length || 0) < room.maxPlayers && (
            <div className="flex items-center gap-3 border border-dashed border-white/15 rounded-xl px-3.5 py-3 text-[#EDEAE3]/35">
              <div className="w-[34px] h-[34px] rounded-[10px] border border-dashed border-white/20"></div>
              <span className="flex-1 font-normal text-[14px]">Waiting for players…</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[12px]"></div>

      {/* Start Button */}
      {isHost ? (
        <button 
          onClick={startGame}
          disabled={(room.players?.length || 0) < 1}
          className="h-[56px] rounded-2xl bg-accent flex items-center justify-center gap-2.5 font-semibold text-[17px] text-[#0B0D10] disabled:opacity-50 hover:brightness-110 transition-all"
        >
          Start round <span className="font-mono font-medium text-[13px] opacity-60">{room.players?.length} ready</span>
        </button>
      ) : (
        <div className="h-[56px] rounded-2xl border border-white/10 flex items-center justify-center gap-2.5 font-medium text-[15px] text-[#EDEAE3]/60">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          Waiting for host to start
        </div>
      )}
    </div>
  );
}
