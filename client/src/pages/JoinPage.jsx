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
  { color: 'bg-surface-sand', icon: '🤖' },
  { color: 'bg-surface-blue', icon: '👻' },
  { color: 'bg-[#E8E4DA]', icon: '👾' },
];

export default function JoinPage() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { user, loading, signInAsGuest } = useAuth(); // Assume we implement this
  const { socket } = useSocket();
  const { dispatch } = useGame();
  useGameSocket();

  const [nickname, setNickname] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [roomCode, setRoomCode] = useState(code || '');

  // If user is logged in, auto-join room if code exists
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

  const handleGuestJoin = async () => {
    if (!nickname.trim()) return;
    if (!roomCode && !code) {
      alert("Please enter a room code.");
      return;
    }
    const finalCode = code || roomCode;
    
    // We will implement signInAsGuest in AuthContext which creates a fake session
    try {
      if (signInAsGuest) {
        await signInAsGuest(nickname.trim(), AVATARS[avatarIndex].icon);
        navigate(`/join/${finalCode}`);
      } else {
        alert("Guest mode requires backend updates. Please use Google Login for now!");
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (user && code) return <Loader fullScreen />;

  // Mockup 2c: Guest Join - Profile & Nickname
  return (
    <div className="min-h-screen box-border bg-bg text-text flex items-center justify-center font-sans p-6">
      <div className="w-full max-w-[420px] flex flex-col">
        <div className="flex flex-col gap-3.5 mb-10">
          <div className="w-[46px] h-[46px] rounded-[13px] bg-surface-inverted flex items-center justify-center font-bold text-2xl text-accent">
            Q
          </div>
          <h1 className="m-0 font-bold text-[34px] leading-[1.1] tracking-[-0.02em]">
            Choose a<br/>nickname
          </h1>
        </div>

        <div className="flex flex-col gap-8">
          {!code && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">ROOM CODE</span>
              <input 
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="h-[52px] rounded-xl bg-surface-base border border-border-heavy px-4 font-bold font-mono tracking-widest text-base text-text placeholder:text-text-muted/30 focus:outline-none focus:border-surface-inverted transition-colors uppercase"
              />
            </div>
          )}

          {/* Nickname Input */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">NICKNAME</span>
            <input 
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ada"
              className="h-[52px] rounded-xl bg-surface-base border border-border-heavy px-4 font-normal text-base text-text placeholder:text-text-muted/30 focus:outline-none focus:border-surface-inverted transition-colors"
            />
          </div>

          {/* Avatar Picker */}
          <div className="flex flex-col gap-3">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">PICK AN AVATAR</span>
            <div className="flex items-center gap-3">
              {AVATARS.map((avatar, i) => (
                <button 
                  key={i}
                  onClick={() => setAvatarIndex(i)}
                  className={`w-[48px] h-[48px] rounded-[14px] ${avatar.color} flex items-center justify-center text-2xl transition-transform ${avatarIndex === i ? 'scale-110 ring-2 ring-border-heavy ring-offset-2 ring-offset-bg' : 'opacity-70 hover:opacity-100 shadow-sm'}`}
                >
                  {avatar.icon}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGuestJoin}
            className="h-[54px] rounded-xl bg-surface-inverted flex items-center justify-center font-semibold text-[17px] text-text-inverted mt-4 hover:opacity-90 transition-all shadow-md"
          >
            Continue
          </button>
        </div>

        <div className="mt-12 border-t border-border pt-4 flex flex-col items-center gap-2.5">
          <span className="font-normal text-[13px] text-text-muted">Already have an account?</span>
          <button 
            onClick={() => {
              if (code) sessionStorage.setItem('pendingJoinCode', code);
              navigate(code ? `/login?redirect=/join/${code}` : '/login');
            }}
            className="font-semibold text-sm text-surface-inverted hover:underline transition-all"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
