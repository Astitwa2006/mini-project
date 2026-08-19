import { useEffect, useRef, useState } from 'react';

/**
 * Countdown timer hook.
 * @param {number}   durationMs  - Total duration in milliseconds
 * @param {boolean}  running     - Starts/stops the timer
 * @param {function} onExpire    - Called when timer reaches 0
 */
export function useTimer(durationMs, running = false, onExpire) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    setRemainingMs(durationMs);
  }, [durationMs]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    intervalRef.current  = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const left    = Math.max(0, durationMs - elapsed);
      setRemainingMs(left);

      if (left === 0) {
        clearInterval(intervalRef.current);
        onExpire?.();
      }
    }, 100); // 100ms precision

    return () => clearInterval(intervalRef.current);
  }, [running, durationMs, onExpire]);

  const progress = durationMs > 0 ? remainingMs / durationMs : 0; // 1.0 → 0.0

  return { remainingMs, progress };
}
