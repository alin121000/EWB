const listeners = new Set();
export const syncState = { online: navigator.onLine, pending: 0, syncing: false };

export function subscribeSync(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSyncState(partial) {
  Object.assign(syncState, partial);
  listeners.forEach((fn) => fn({ ...syncState }));
}

window.addEventListener('online', () => setSyncState({ online: true }));
window.addEventListener('offline', () => setSyncState({ online: false }));
