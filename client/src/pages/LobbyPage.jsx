import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { SOCKET_EVENTS } from '../utils/constants.js';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import TopicPicker from '../components/lobby/TopicPicker.jsx';
import RoomCard from '../components/lobby/RoomCard.jsx';
import { DIFFICULTY } from '../utils/constants.js';

export default function LobbyPage() {
  const { user, profile, signOut } = useAuth();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  const { createRoom } = useGameSocket();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [joinCode,   setJoinCode]   = useState('');
  const [creating,   setCreating]   = useState(false);

  // Room config state
  const [topics,        setTopics]        = useState(['startups']);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty,    setDifficulty]    = useState('any');
  const [maxPlayers,    setMaxPlayers]    = useState(8);

  function handleCreateRoom() {
    if (!topics.length) return;
    setCreating(true);

    createRoom({ topics, questionCount, difficulty, maxPlayers });

    socket.once(SOCKET_EVENTS.ROOM_CREATED, (roomData) => {
      dispatch({ type: 'SET_ROOM', payload: roomData });
      setCreating(false);
      navigate(`/room/${roomData.roomId}`);
    });

    socket.once(SOCKET_EVENTS.ERROR, ({ message }) => {
      alert(message);
      setCreating(false);
    });
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return;
    navigate(`/join/${code}`);
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-xl font-black font-display gradient-text">QuizRush ⚡</span>
        <div className="flex items-center gap-4">
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-slate-300 text-sm hidden sm:block">{profile?.username || user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black font-display">
            Welcome back, <span className="gradient-text">{profile?.username?.split(' ')[0] || 'Player'}</span> 👋
          </h1>
          <p className="text-slate-400 mt-2">Create a new room or join an existing one.</p>
        </motion.div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoomCard
            title="Create Room"
            description="Set topics, difficulty, and invite friends via link or code."
            icon="🎮"
            variant="primary"
            onClick={() => setShowCreate(true)}
          />

          <motion.div className="glass rounded-2xl p-6 flex flex-col justify-center border border-emerald-500/30 group bg-white/5 hover:bg-white/10 transition-colors" whileHover={{ y: -2 }}>
            <div className="flex items-center gap-4 mb-2">
              <div className="text-4xl">🔑</div>
              <h2 className="text-2xl font-bold font-display text-white group-hover:text-emerald-300 transition-colors">Join Room</h2>
            </div>
            <p className="text-slate-400 text-sm ml-14 mb-4">Enter a 6-character room code to jump in.</p>
            <form onSubmit={handleJoinRoom} className="flex gap-2 ml-14">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white
                           font-mono text-lg tracking-widest uppercase focus:outline-none focus:border-violet-500"
              />
              <Button type="submit" disabled={joinCode.length !== 6}>Join</Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Create Room Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Room" size="lg">
        <div className="space-y-5">
          <TopicPicker selected={topics} onChange={setTopics} />

          {/* Question count */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Questions: <span className="text-white font-bold">{questionCount}</span></label>
            <input
              type="range" min={5} max={20} value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Difficulty</label>
            <div className="flex gap-2">
              {Object.entries(DIFFICULTY).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all
                    ${difficulty === key ? 'text-white border-transparent' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                  style={difficulty === key ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max players */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Max Players: <span className="text-white font-bold">{maxPlayers}</span></label>
            <input
              type="range" min={2} max={20} value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          <Button
            className="w-full" size="lg"
            loading={creating}
            disabled={!topics.length || creating}
            onClick={handleCreateRoom}
          >
            🚀 Create Room
          </Button>
        </div>
      </Modal>
    </div>
  );
}
