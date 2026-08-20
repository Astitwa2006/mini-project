import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import TopicPicker from '../components/lobby/TopicPicker.jsx';
import { TILE_COLORS } from '../utils/constants.js';

export default function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(profile?.username || '');
  const [tileIndex, setTileIndex] = useState(0);
  const [topics, setTopics] = useState([]);
  const [saving, setSaving] = useState(false);

  const initials = (nickname.replace(/[^a-z0-9]/gi, '').slice(0, 2) || '??').toUpperCase();
  const canContinue = nickname.trim().length > 0 && topics.length > 0 && !saving;

  async function handleContinue() {
    if (!canContinue) return;
    setSaving(true);
    try {
      await api.upsertProfile({
        username:  nickname.trim(),
        tileColor: TILE_COLORS[tileIndex],
        favTopics: topics,
        onboarded: true,
      });
      await refreshProfile();
      navigate('/lobby', { replace: true });
    } catch (err) {
      alert(err.message || 'Could not save your profile — try again.');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen box-border bg-bg text-text flex items-center justify-center font-sans p-6">
      <div className="w-full max-w-[440px] flex flex-col gap-8 py-10">
        <div className="flex flex-col gap-3.5">
          <div className="w-[46px] h-[46px] rounded-[13px] bg-surface-inverted flex items-center justify-center font-bold text-2xl text-accent">
            Q
          </div>
          <h1 className="m-0 font-bold text-[34px] leading-[1.1] tracking-[-0.02em]">Pick a handle</h1>
          <p className="m-0 text-text-muted text-[15px]">This is what the room sees on the leaderboard.</p>
        </div>

        {/* Nickname + tile */}
        <div className="flex items-center gap-4">
          <div
            className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center font-bold text-[22px] text-[#14161A] shrink-0"
            style={{ background: TILE_COLORS[tileIndex] }}
          >
            {initials}
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">NICKNAME</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 18))}
              placeholder="turing_test"
              className="h-[52px] rounded-xl bg-surface-base border border-border-heavy px-4 font-semibold text-base text-text placeholder:text-text-muted/40 focus:outline-none focus:border-surface-inverted transition-colors"
            />
          </div>
        </div>

        {/* Tile colour */}
        <div className="flex flex-col gap-3">
          <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">TILE COLOUR</span>
          <div className="flex gap-2.5">
            {TILE_COLORS.map((color, i) => (
              <button
                key={color}
                onClick={() => setTileIndex(i)}
                style={{ background: color }}
                className={`w-[38px] h-[38px] rounded-[11px] transition-transform ${tileIndex === i ? 'scale-110 ring-2 ring-surface-inverted ring-offset-2 ring-offset-bg' : 'opacity-60 hover:opacity-100'}`}
              />
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="bg-surface-alt border border-border rounded-2xl p-5 flex flex-col gap-3">
          <TopicPicker selected={topics} onChange={setTopics} />
          <span className="text-[12px] text-text-muted leading-[1.5]">
            Weights which articles your solo rounds pull from.
          </span>
        </div>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="h-[56px] rounded-2xl bg-surface-inverted text-text-inverted font-semibold text-[17px] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
        >
          {saving ? 'Saving…' : (topics.length ? 'Continue' : 'Pick at least one topic')}
        </button>
      </div>
    </div>
  );
}
