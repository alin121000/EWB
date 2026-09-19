import { useEffect, useState } from 'react';
import { subscribeSync, syncState } from '../lib/syncStore.js';

export default function SyncBar() {
  const [state, setState] = useState(syncState);

  useEffect(() => subscribeSync(setState), []);

  if (state.online && state.pending === 0 && !state.syncing) {
    return null;
  }

  let label = '';
  let dotClass = 'sync-dot';
  if (!state.online) {
    label = state.pending > 0 ? `Offline – ${state.pending} change(s) waiting to sync` : 'Offline – changes will save locally';
    dotClass += ' offline';
  } else if (state.syncing) {
    label = 'Syncing…';
    dotClass += ' syncing';
  } else if (state.pending > 0) {
    label = `${state.pending} change(s) waiting to sync`;
    dotClass += ' syncing';
  }

  return (
    <div className="sync-bar">
      <span className={dotClass} />
      <span>{label}</span>
    </div>
  );
}
