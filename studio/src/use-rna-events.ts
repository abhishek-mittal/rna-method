import { useEffect, useState } from 'react';

/**
 * Subscribes to the server's SSE stream at /api/events.
 *
 * Returns:
 *  - tick: number — increments every time any RNA file changes (receptors.json,
 *    timeline.json, agent-context.json). Use as a useEffect dependency to
 *    trigger an automatic re-fetch.
 *  - connected: boolean — true while the SSE connection is live.
 */
export function useRnaEvents(): { tick: number; connected: boolean } {
  const [tick, setTick]           = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;

    const es = new EventSource('/api/events');

    es.onopen    = () => setConnected(true);
    es.onmessage = () => setTick((t) => t + 1);
    es.onerror   = () => setConnected(false);

    // EventSource auto-reconnects on error — no manual retry needed.
    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return { tick, connected };
}
