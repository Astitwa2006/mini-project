import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { SOCKET_EVENTS } from '../utils/constants.js';
import TopicPicker from '../components/lobby/TopicPicker.jsx';
import { DIFFICULTY } from '../utils/constants.js';

export default function LobbyPage() {
  const { user, profile, signOut } = useAuth();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  const { createRoom } = useGameSocket();
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);

  // Room config state
  const [topics, setTopics] = useState(['startups']);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('any');
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(10);

  function handleCreateRoom() {
    if (!topics.length) return;
    setCreating(true);

    createRoom({ topics, questionCount, difficulty, maxPlayers: 8, questionTimeSeconds });

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
    if (code.length !== 5 && code.length !== 6) return;
    navigate(`/join/${code}`);
  }

  return (
    <div className="min-h-screen box-border bg-bg text-text font-sans flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-alt">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-inverted flex items-center justify-center font-bold text-lg text-accent">Q</div>
          <span className="text-xl font-bold tracking-tight">QuizRush</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-sm hidden sm:block">{profile?.username || user?.email}</span>
          <button onClick={() => navigate('/profile')} className="font-medium text-sm text-text-muted hover:text-text">Profile</button>
          <button onClick={signOut} className="font-medium text-sm text-text-muted hover:text-text">Sign out</button>
        </div>
      </nav>

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
        
        {/* Left Col: Create Room */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-[34px] font-bold leading-tight tracking-tight">
              Host a room
            </h1>
            <p className="text-text-muted mt-1">Configure topics and invite your friends.</p>
          </div>

          <div className="bg-surface-base border border-border rounded-[18px] p-6 space-y-6 shadow-sm">
            <TopicPicker selected={topics} onChange={setTopics} />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted font-mono tracking-widest text-[10px]">QUESTIONS</span>
                <span className="font-bold text-surface-inverted dark:text-accent">{questionCount}</span>
              </div>
              <input
                type="range" min={5} max={20} value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-surface-inverted dark:accent-accent"
              />
            </div>

            <div className="space-y-3">
              <span className="text-text-muted font-mono tracking-widest text-[10px] block">DIFFICULTY</span>
              <div className="flex gap-2">
                {Object.entries(DIFFICULTY).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                      ${difficulty === key ? 'text-text-inverted border-transparent bg-surface-inverted' : 'border-border text-text-muted hover:bg-surface-alt'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-text-muted font-mono tracking-widest text-[10px] block">SECONDS PER QUESTION</span>
              <div className="flex gap-2">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionTimeSeconds(n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                      ${questionTimeSeconds === n ? 'text-text-inverted border-transparent bg-surface-inverted' : 'border-border text-text-muted hover:bg-surface-alt'}`}
                  >
                    {n}s
                  </button>
                ))}
              </div>
            </div>

            <button
              className="w-full h-[54px] rounded-xl bg-surface-inverted text-text-inverted font-semibold text-[17px] disabled:opacity-50 hover:opacity-90 transition-all mt-4 shadow-sm"
              disabled={!topics.length || creating}
              onClick={handleCreateRoom}
            >
              {creating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </div>

        {/* Right Col: Join Room */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-[34px] font-bold leading-tight tracking-tight">
              Join a room
            </h1>
            <p className="text-text-muted mt-1">Got a code? Enter it below.</p>
          </div>

          <form onSubmit={handleJoinRoom} className="bg-surface-base border border-border rounded-[18px] p-6 flex flex-col gap-4 shadow-sm">
             <div className="flex flex-col gap-1.5">
                <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">ROOM CODE</span>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="7KD9F"
                  className="h-[64px] rounded-xl bg-surface-alt border border-border-heavy px-4 font-mono font-bold text-3xl tracking-widest text-center text-surface-inverted dark:text-accent placeholder:text-text-muted/40 focus:outline-none focus:border-surface-inverted transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={joinCode.length < 5}
                className="w-full h-[54px] rounded-xl bg-surface-alt border border-border-heavy flex items-center justify-center font-semibold text-[17px] text-text disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10 transition-all mt-2"
              >
                Join
              </button>
          </form>
        </div>

      </div>
    </div>
  );
}
