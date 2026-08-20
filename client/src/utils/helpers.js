/** Copies text to clipboard, returns true on success */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Format a score number with commas: 1200 → "1,200" */
export function formatScore(score) {
  return new Intl.NumberFormat().format(score ?? 0);
}

/** Build the shareable room URL from code */
export function buildShareUrl(code) {
  return `${window.location.origin}/join/${code}`;
}

/** Returns ordinal suffix for a number: 1→"st", 2→"nd", 3→"rd", n→"th" */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Returns the user's initials for avatar fallback */
export function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

/** ms → "0:30" style countdown string */
export function msToCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Longest run of consecutive `correct: true` entries, in order. */
export function longestStreak(history = []) {
  let best = 0, current = 0;
  for (const entry of history) {
    current = entry.correct ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}
