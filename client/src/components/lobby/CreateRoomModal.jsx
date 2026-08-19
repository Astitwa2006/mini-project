import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TopicPicker from './TopicPicker';

export default function CreateRoomModal({ isOpen, onClose, onCreate }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(10);
  const [timer, setTimer] = useState(15);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topics.length === 0) return alert('Please select at least one topic.');
    setLoading(true);
    onCreate({ topics, questions, timer });
    // Keep loading true while waiting for socket response
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Quiz Topics
          </label>
          <TopicPicker selected={topics} onChange={setTopics} max={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Questions
            </label>
            <select
              value={questions}
              onChange={(e) => setQuestions(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 appearance-none"
            >
              <option value={5}>5 Questions (Quick)</option>
              <option value={10}>10 Questions (Normal)</option>
              <option value={20}>20 Questions (Long)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Time limit per Q
            </label>
            <select
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 appearance-none"
            >
              <option value={10}>10 Seconds (Fast)</option>
              <option value={15}>15 Seconds (Normal)</option>
              <option value={20}>20 Seconds (Relaxed)</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" loading={loading} disabled={topics.length === 0}>
          Create Room & Host
        </Button>
      </form>
    </Modal>
  );
}
