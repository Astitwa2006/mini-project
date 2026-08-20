import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { TILE_COLORS, FORMAT_LABELS } from '../utils/constants.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { history } = useGame();
  const { isDark, setLight, setDark } = useTheme();

  const tile = profile?.tile_color || TILE_COLORS[0];
  const initials = (profile?.username || '??').slice(0, 2).toUpperCase();
  const beats = profile?.fav_topics?.length ? profile.fav_topics.join(', ') : 'nothing yet';

  const played = history.length;
  const hits = history.filter((h) => h.correct).length;
  const accuracy = played ? Math.round((hits / played) * 100) : null;

  const byFormat = Object.keys(FORMAT_LABELS).map((key) => {
    const rows = history.filter((h) => h.type === key);
    const pct = rows.length ? Math.round((rows.filter((r) => r.correct).length / rows.length) * 100) : null;
    return { key, label: FORMAT_LABELS[key], pct, count: rows.length };
  });
  const scored = byFormat.filter((f) => f.pct !== null);
  const weakest = scored.length ? [...scored].sort((a, b) => a.pct - b.pct)[0] : null;

  return (
    <div className="min-h-screen box-border bg-bg text-text flex flex-col font-sans">
      <div className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-[22px] pt-[56px] pb-[44px] gap-6">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="font-medium text-[13px] text-text-muted hover:text-text transition-colors">← Back</button>
          <div className="flex items-center bg-black/[0.07] dark:bg-white/[0.07] rounded-full p-[3px]">
            <span onClick={setLight} className={`px-[11px] py-[5px] rounded-full text-[12px] cursor-pointer ${!isDark ? 'bg-surface-base text-text font-semibold shadow-sm' : 'font-medium text-text-muted'}`}>Light</span>
            <span onClick={setDark} className={`px-[11px] py-[5px] rounded-full text-[12px] cursor-pointer ${isDark ? 'bg-surface-base text-text font-semibold shadow-sm' : 'font-medium text-text-muted'}`}>Dark</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center font-bold text-[26px] text-[#14161A]" style={{ background: tile }}>
            {initials}
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="font-bold text-[26px] tracking-[-0.03em]">{profile?.username || 'Player'}</span>
            <span className="font-normal text-[13px] text-text-muted">Follows {beats}</span>
          </div>
        </div>

        <div className="flex gap-2.5">
          <div className="flex-1 rounded-2xl p-[15px] flex flex-col gap-1 bg-surface-inverted text-text-inverted">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] opacity-55">LIFETIME SCORE</span>
            <span className="font-bold text-[22px]">{(profile?.total_score || 0).toLocaleString()}</span>
          </div>
          <div className="flex-1 rounded-2xl p-[15px] flex flex-col gap-1 bg-surface-base border border-border">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">GAMES PLAYED</span>
            <span className="font-bold text-[22px]">{profile?.games_played || 0}</span>
          </div>
          <div className="flex-1 rounded-2xl p-[15px] flex flex-col gap-1 bg-surface-base border border-border">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-text-muted">LAST GAME</span>
            <span className="font-bold text-[22px]">{accuracy !== null ? `${accuracy}%` : '—'}</span>
          </div>
        </div>

        <div className="bg-surface-base border border-border rounded-2xl p-[18px] flex flex-col gap-3.5">
          <span className="font-semibold text-[15px]">Accuracy by answer format</span>
          {played === 0 ? (
            <span className="text-[13px] text-text-muted">Play a round to see your breakdown here.</span>
          ) : (
            byFormat.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="font-medium text-[12.5px] w-[70px] text-text-muted">{f.label}</span>
                <div className="flex-1 h-[11px] rounded-md bg-black/10 dark:bg-white/10 overflow-hidden">
                  {f.pct !== null && (
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${f.pct}%`, background: f.pct < 50 ? 'var(--color-danger, #FF7A66)' : 'var(--color-accent, #C8FF4D)' }}
                    />
                  )}
                </div>
                <span className="font-mono font-semibold text-[12px] w-[38px] text-right">{f.pct !== null ? `${f.pct}%` : '—'}</span>
              </div>
            ))
          )}
        </div>

        <div className="bg-surface-inverted text-text-inverted rounded-2xl p-[18px] flex flex-col gap-2">
          <span className="font-mono font-medium text-[10px] tracking-[0.14em] opacity-55">WEAK SPOT</span>
          <span className="font-semibold text-[17px] leading-[1.35] text-balance">
            {weakest ? `You lose the most points on ${weakest.label.toLowerCase()} questions.` : 'Play a round to see where you lose points.'}
          </span>
          <button
            onClick={() => navigate('/lobby')}
            className="mt-1 font-semibold text-[14px] bg-accent text-[#14161A] rounded-[11px] py-2.5 text-center hover:opacity-90 transition-opacity"
          >
            Play another round
          </button>
        </div>

        <div className="flex-1 min-h-[6px]" />
      </div>
    </div>
  );
}
