import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { TOPICS, DIFFICULTY, GAME_PHASE } from '../utils/constants.js';
import Button from '../components/ui/Button.jsx';
import ShareRoomModal from '../components/lobby/ShareRoomModal.jsx';
import PlayerList from '../components/lobby/PlayerList.jsx';
import { buildShareUrl } from '../utils/helpers.js';

export default function WaitingRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, phase } = useGame();
  const { startGame, leaveRoom } = useGameSocket();
  const [shareOpen, setShareOpen] = useState(false);

  const isHost = room?.hostId === user?.id;

  // useGameSocket() (above) already listens for game:starting and updates
  // `phase` in shared context — react to that instead of attaching a
  // second raw socket listener for the same event, which would (a) double
  // -dispatch and (b) risk wiping the hook's own listener on unmount, since
  // socket.off(event) with no handler removes every listener for that
  // event, not just this component's.
  useEffect(() => {
    if (phase === GAME_PHASE.STARTING) {
      navigate(`/game/${id}`, { replace: true });
    }
  }, [phase, id, navigate]);

  if (!room) return null;

  const shareUrl = room.shareUrl || buildShareUrl(room.code);

  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-lg space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Room code */}
        <div className="glass rounded-3xl p-8 text-center space-y-4">
          <p className="text-slate-400 text-sm font-medium">Room Code</p>
          <h1 className="text-6xl font-black font-display tracking-widest gradient-text">{room.code}</h1>
          <div className="flex gap-2 justify-center flex-wrap">
            {room.topics?.map((slug) => (
              <span
                key={slug}
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: TOPICS[slug]?.color + '22', color: TOPICS[slug]?.color }}
              >
                {TOPICS[slug]?.label}
              </span>
            ))}
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/10 text-slate-300">
              {room.questionCount} Qs · {DIFFICULTY[room.difficulty]?.label || 'Any'} difficulty
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
            🔗 Invite Players
          </Button>
        </div>

        {/* Players */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Players ({room.players?.length || 0}/{room.maxPlayers})
            </h2>
          </div>
          <PlayerList players={room.players || []} hostId={room.hostId} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { leaveRoom(); navigate('/lobby'); }} className="flex-1">
            Leave
          </Button>
          {isHost && (
            <Button
              size="md" className="flex-1"
              disabled={(room.players?.length || 0) < 1}
              onClick={startGame}
            >
              🚀 Start Game
            </Button>
          )}
          {!isHost && (
            <div className="flex-1 glass rounded-xl flex items-center justify-center">
              <span className="text-slate-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Waiting for host...
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <ShareRoomModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        code={room.code}
        shareUrl={shareUrl}
      />
    </div>
  );
}
