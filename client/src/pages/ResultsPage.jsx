import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ordinal } from '../utils/helpers.js';

const AVATAR_COLORS = ['bg-accent', 'bg-danger', 'bg-[#EDEAE3]', 'bg-[#8FD6FF]', 'bg-[#E8E4DA]'];

export default function ResultsPage() {
  const { leaderboard, room, reset } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();

  const myResult = leaderboard.find((p) => p.id === user?.id);
  
  // Get top 3 for podium
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  function handlePlayAgain() {
    reset();
    navigate('/lobby');
  }

  return (
    <div className="min-h-screen box-border px-[22px] pt-[66px] pb-[44px] bg-bg text-text flex flex-col gap-[20px] font-sans dark max-w-md mx-auto">
      
      <div className="flex flex-col gap-1">
        <span className="font-mono font-medium text-[10px] tracking-[0.16em] text-[#EDEAE3]/45 uppercase">
          ROOM {room?.code} · {room?.questionCount || 10} QUESTIONS
        </span>
        <h2 className="m-0 font-bold text-[34px] leading-[1.05] tracking-[-0.03em]">
          You came <span className="text-accent">{ordinal(myResult?.rank || 1)}</span>
        </h2>
      </div>

      {/* Podium */}
      <div className="flex items-end gap-[10px] h-[210px] mt-4">
        {/* 2nd Place */}
        {second ? (
          <div className="flex-1 flex flex-col items-center gap-[8px]">
            <div className={`w-[38px] h-[38px] rounded-[11px] ${AVATAR_COLORS[1]} text-[#0B0D10] flex items-center justify-center font-bold text-[14px]`}>
              {second.username?.substring(0,2).toUpperCase() || 'P2'}
            </div>
            <div className="w-full h-[118px] rounded-t-[12px] bg-gradient-to-b from-[#C8FF4D]/40 to-[#C8FF4D]/[0.08] border border-[#C8FF4D]/35 border-b-0 flex flex-col items-center justify-start pt-[12px] gap-[2px]">
              <span className="font-mono font-bold text-[20px]">2</span>
              <span className="font-mono font-medium text-[12px] text-[#EDEAE3]/70">{second.score.toLocaleString()}</span>
            </div>
          </div>
        ) : <div className="flex-1" />}

        {/* 1st Place */}
        {first && (
          <div className="flex-1 flex flex-col items-center gap-[8px]">
            <div className="w-[18px] h-[18px] text-[18px] mb-[-4px]">👑</div>
            <div className={`w-[38px] h-[38px] rounded-[11px] ${AVATAR_COLORS[0]} text-[#0B0D10] flex items-center justify-center font-bold text-[14px]`}>
              {first.username?.substring(0,2).toUpperCase() || 'P1'}
            </div>
            <div className="w-full h-[150px] rounded-t-[12px] bg-gradient-to-b from-[#C8FF4D]/70 to-[#C8FF4D]/[0.15] border border-[#C8FF4D]/60 border-b-0 flex flex-col items-center justify-start pt-[12px] gap-[2px]">
              <span className="font-mono font-bold text-[20px] text-[#0B0D10]">1</span>
              <span className="font-mono font-medium text-[12px] text-[#0B0D10]/70">{first.score.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third ? (
          <div className="flex-1 flex flex-col items-center gap-[8px]">
            <div className={`w-[38px] h-[38px] rounded-[11px] ${AVATAR_COLORS[2]} text-[#0B0D10] flex items-center justify-center font-bold text-[14px]`}>
              {third.username?.substring(0,2).toUpperCase() || 'P3'}
            </div>
            <div className="w-full h-[90px] rounded-t-[12px] bg-gradient-to-b from-[#C8FF4D]/20 to-[#C8FF4D]/[0.05] border border-[#C8FF4D]/20 border-b-0 flex flex-col items-center justify-start pt-[12px] gap-[2px]">
              <span className="font-mono font-bold text-[20px]">3</span>
              <span className="font-mono font-medium text-[12px] text-[#EDEAE3]/70">{third.score.toLocaleString()}</span>
            </div>
          </div>
        ) : <div className="flex-1" />}
      </div>

      <div className="flex-1 min-h-[20px]"></div>

      <button className="h-[54px] rounded-[14px] bg-white/5 border border-white/10 flex items-center justify-center font-semibold text-[16px] text-[#EDEAE3]/85 hover:bg-white/10 transition-all">
        Review answers
      </button>
      <button 
        onClick={handlePlayAgain}
        className="h-[54px] rounded-[14px] bg-accent flex items-center justify-center font-semibold text-[16px] text-[#0B0D10] hover:brightness-110 transition-all"
      >
        Back to lobby
      </button>
    </div>
  );
}
