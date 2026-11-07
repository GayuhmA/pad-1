export const SESSION_CHANNEL = 'pad-session';
export const SESSION_EVENT_KEY = 'pad-session-event';

export function createSessionChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SESSION_CHANNEL) : null;
  } catch { return null; }
}

/** Broadcast only an invalidation signal, never account data or credentials. */
export function publishSessionChange() {
  if (typeof window === 'undefined') return;
  const channel = createSessionChannel();
  if (channel) {
    try {
      channel.postMessage('changed');
      return;
    } catch { /* Fall back to a storage event when channels are restricted. */ }
    finally { channel.close(); }
  }
  try { localStorage.setItem(SESSION_EVENT_KEY, `${Date.now()}-${Math.random()}`); } catch { /* Storage can be disabled. */ }
}
