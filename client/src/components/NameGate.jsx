import { useState } from 'react';
import { getAuthorName, setAuthorName } from '../identity.js';

export default function NameGate({ children }) {
  const [name, setName] = useState(getAuthorName());
  const [draft, setDraft] = useState('');

  if (name) return children;

  return (
    <div className="sheet-backdrop">
      <div className="sheet" style={{ maxWidth: 420, borderRadius: 20, margin: 16 }}>
        <div className="sheet-handle" />
        <h2 style={{ marginTop: 0 }}>Welcome 👋</h2>
        <p className="muted small">
          What's your name? It'll be attached to what you add, so the team knows who wrote what — you won't be asked
          again on this phone.
        </p>
        <div className="field">
          <input
            className="input"
            autoFocus
            placeholder="e.g. Dana"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                setAuthorName(draft.trim());
                setName(draft.trim());
              }
            }}
          />
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={!draft.trim()}
          onClick={() => {
            setAuthorName(draft.trim());
            setName(draft.trim());
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}
