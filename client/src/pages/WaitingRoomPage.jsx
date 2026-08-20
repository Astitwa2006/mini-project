import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { GAME_PHASE, TOPICS } from '../utils/constants.js';
import { buildShareUrl } from '../utils/helpers.js';

const AVATAR_COLORS = ['bg-accent', 'bg-danger', 'bg-surface-sand', 'bg-surface-blue', 'bg-surface-base'];

export default function WaitingRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, phase } = useGame();
  const { isDark, setLight, setDark } = useTheme();
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
    <div className="min-h-screen box-border bg-bg text-text flex flex-col font-sans">
      <div className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-6 pt-16 pb-12 gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { leaveRoom(); navigate('/lobby'); }}
            className="font-medium text-[13px] text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            ← Leave
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono font-medium text-[11px] tracking-[0.1em] text-text-muted">
              HOST: {hostPlayer?.username || 'unknown'}
            </span>
            <div className="flex items-center bg-black/[0.07] dark:bg-white/[0.07] rounded-full p-[3px]">
              <span onClick={setLight} className={`px-2 py-[3px] rounded-full text-[11px] cursor-pointer ${!isDark ? 'bg-surface-base text-text font-semibold shadow-sm' : 'font-medium text-text-muted'}`}>Light</span>
              <span onClick={setDark} className={`px-2 py-[3px] rounded-full text-[11px] cursor-pointer ${isDark ? 'bg-surface-base text-text font-semibold shadow-sm' : 'font-medium text-text-muted'}`}>Dark</span>
            </div>
          </div>
        </div>

        {/* Code Box */}
        <div className="rounded-2xl bg-surface-alt border border-surface-inverted/20 dark:border-accent/30 p-5 shadow-sm">
          <span className="font-mono font-medium text-[10px] tracking-[0.14em] text-text-muted">
            ROOM CODE
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="font-mono font-bold text-[42px] leading-none tracking-[0.08em] text-surface-inverted dark:text-accent">
              {room.code}
            </span>
            <button 
              onClick={handleCopyLink}
              className="font-medium text-xs text-text-muted border border-border-heavy rounded-lg px-3 py-2 hover:bg-surface-base transition-colors"
            >
              Copy link
            </button>
          </div>
        </div>

        {/* Settings Pills */}
        <div className="flex gap-2 flex-wrap">
          <span className="font-mono font-medium text-[11px] text-text bg-surface-base border border-border rounded-full px-3 py-1.5 shadow-sm">
            {room.questionCount} questions
          </span>
          <span className="font-mono font-medium text-[11px] text-text bg-surface-base border border-border rounded-full px-3 py-1.5 shadow-sm">
            {room.questionTimeSeconds || 10}s each
          </span>
          {(room.topics?.length ? room.topics : ['startups']).map((slug) => (
            <span key={slug} className="font-mono font-medium text-[11px] text-[#0B0D10] bg-danger rounded-full px-3 py-1.5">
              {TOPICS[slug]?.label || slug}
            </span>
          ))}
        </div>

        {/* Players List */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="font-semibold text-[15px]">In the room</span>
            <span className="font-mono font-medium text-[12px] text-text-muted">
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
                <div key={p.id} className={`flex items-center gap-3 border rounded-xl px-3.5 py-3 shadow-sm ${isMe ? 'bg-accent/10 border-accent/40' : 'bg-surface-base border-border'}`}>
                  <div
                    className={`w-[34px] h-[34px] rounded-[10px] text-[#0B0D10] border border-border-heavy flex items-center justify-center font-bold text-sm ${p.tileColor ? '' : colorClass}`}
                    style={p.tileColor ? { background: p.tileColor } : undefined}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 font-medium text-[15px]">
                    {p.username || 'Guest'}{isMe ? ' (you)' : ''}
                    {pHost && <span className="ml-2 font-mono font-medium text-[10px] text-text-muted tracking-[0.08em]">HOST</span>}
                  </span>
                  <span className="font-mono font-medium text-[11px] text-surface-inverted dark:text-accent">
                    READY
                  </span>
                </div>
              );
            })}

            {/* Waiting slot */}
            {(room.players?.length || 0) < room.maxPlayers && (
              <div className="flex items-center gap-3 border border-dashed border-border-heavy rounded-xl px-3.5 py-3 text-text-muted/60">
                <div className="w-[34px] h-[34px] rounded-[10px] border border-dashed border-border-heavy"></div>
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
            className="h-[56px] rounded-2xl bg-surface-inverted flex items-center justify-center gap-2.5 font-semibold text-[17px] text-text-inverted disabled:opacity-50 hover:opacity-90 transition-all shadow-md"
          >
            Start round <span className="font-mono font-medium text-[13px] opacity-60">{room.players?.length} ready</span>
          </button>
        ) : (
          <div className="h-[56px] rounded-2xl bg-surface-base border border-border flex items-center justify-center gap-2.5 font-medium text-[15px] text-text-muted">
            <span className="w-2 h-2 rounded-full bg-surface-inverted dark:bg-accent animate-pulse"></span>
            Waiting for host to start
          </div>
        )}
      </div>
    </div>
  );
}
