import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { useGame } from '../context/GameContext.jsx';
import { SOCKET_EVENTS } from '../utils/constants.js';
import { useSocket } from '../context/SocketContext.jsx';
import Loader from '../components/ui/Loader.jsx';

const AVATARS = [
  { color: 'bg-accent', icon: '🤓' },
  { color: 'bg-danger', icon: '👽' },
  { color: 'bg-[#EDEAE3]', icon: '🤖' },
  { color: 'bg-[#8FD6FF]', icon: '👻' },
  { color: 'bg-[#E8E4DA]', icon: '👾' },
];

export default function JoinPage() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  useGameSocket();

  const [nickname, setNickname] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);

  // If user is logged in, auto-join room
  useEffect(() => {
    if (loading || !user || !socket || !code) return;

    api.getRoom(code)
      .then((data) => {
        dispatch({ type: 'SET_ROOM', payload: data.room });
        socket.emit(SOCKET_EVENTS.ROOM_JOIN, { code });
        socket.once(SOCKET_EVENTS.ROOM_JOINED, (roomData) => {
          dispatch({ type: 'SET_ROOM', payload: roomData });
          navigate(`/room/${roomData.roomId}`, { replace: true });
        });
        socket.once(SOCKET_EVENTS.ERROR, ({ message }) => {
          alert(`Could not join: ${message}`);
          navigate('/lobby', { replace: true });
        });
      })
      .catch(() => {
        alert('Room not found or has expired.');
        navigate('/lobby', { replace: true });
      });
  }, [user, loading, socket, code, dispatch, navigate]);

  const handleGuestJoin = () => {
    if (!nickname.trim()) return;
    alert("Guest mode requires backend updates (Phase 5). Please use Google Login for now!");
    sessionStorage.setItem('pendingJoinCode', code);
    navigate(`/login?redirect=/join/${code}`);
  };

  if (loading) return <Loader fullScreen />;
  if (user) return <Loader fullScreen />;

  // Mockup 2c: Guest Join - Profile & Nickname
  return (
    <div className="min-h-screen box-border px-6 pt-16 pb-12 bg-bg text-text flex flex-col font-sans dark max-w-md mx-auto">
      
      <div className="flex flex-col gap-3.5 mb-10">
        <div className="w-[46px] h-[46px] rounded-[13px] bg-accent flex items-center justify-center font-bold text-2xl text-[#0B0D10]">
          Q
        </div>
        <h1 className="m-0 font-bold text-[34px] leading-[1.1] tracking-[-0.02em]">
          Choose a<br/>nickname
        </h1>
      </div>

      <div className="flex flex-col gap-8">
        {/* Nickname Input */}
        <div className="flex flex-col gap-1.5">
          <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-[#EDEAE3]/40">NICKNAME</span>
          <input 
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ada"
            className="h-[52px] rounded-xl bg-white/5 border border-white/10 px-4 font-normal text-base text-[#EDEAE3] placeholder:text-[#EDEAE3]/20 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Avatar Picker */}
        <div className="flex flex-col gap-3">
          <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-[#EDEAE3]/40">PICK AN AVATAR</span>
          <div className="flex items-center gap-3">
            {AVATARS.map((avatar, i) => (
              <button 
                key={i}
                onClick={() => setAvatarIndex(i)}
                className={`w-[48px] h-[48px] rounded-[14px] ${avatar.color} flex items-center justify-center text-2xl transition-transform ${avatarIndex === i ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-bg' : 'opacity-70 hover:opacity-100'}`}
              >
                {avatar.icon}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGuestJoin}
          className="h-[54px] rounded-xl bg-accent flex items-center justify-center font-semibold text-[17px] text-[#0B0D10] mt-4 hover:brightness-110 transition-all"
        >
          Continue
        </button>
      </div>

      <div className="flex-1 min-h-[26px]"></div>

      <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-2.5">
        <span className="font-normal text-[13px] text-[#EDEAE3]/45">Already have an account?</span>
        <button 
          onClick={() => {
            sessionStorage.setItem('pendingJoinCode', code);
            navigate(`/login?redirect=/join/${code}`);
          }}
          className="font-semibold text-sm text-accent hover:underline transition-all"
        >
          Log in
        </button>
      </div>
    </div>
  );
}
