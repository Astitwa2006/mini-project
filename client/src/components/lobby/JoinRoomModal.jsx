import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function JoinRoomModal({ isOpen, onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      alert('Room code must be exactly 6 characters.');
      return;
    }
    setLoading(true);
    onJoin(cleanCode);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Enter 6-character room code
          </label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-[0.2em] uppercase focus:outline-none focus:border-violet-500 transition-colors"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" loading={loading} disabled={code.trim().length !== 6}>
          Join Game
        </Button>
      </form>
    </Modal>
  );
}
