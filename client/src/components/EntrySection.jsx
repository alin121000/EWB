import { useState } from 'react';
import { timeAgo } from '../lib/format.js';

const SECTION_META = {
  meeting: { label: 'Important Meetings / Activities', placeholder: 'Who did we meet / what happened?' },
  finding: { label: 'Important Findings', placeholder: 'What did we learn or discover?' },
  decision: { label: 'Decisions', placeholder: 'What was decided?' },
  problem: { label: 'Problems / Questions', placeholder: 'What still needs clarification?' },
  followup: { label: 'Follow-ups', placeholder: 'What needs to happen as a result?' },
};

export default function EntrySection({ section, entries, onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const meta = SECTION_META[section];

  const submit = async () => {
    if (!text.trim()) return;
    await onAdd(text.trim());
    setText('');
    setOpen(false);
  };

  return (
    <div className="card">
      <div className="row-between">
        <div className="card-title">{meta.label}</div>
        {!open && <button className="icon-btn" onClick={() => setOpen(true)}>+</button>}
      </div>

      {entries.length === 0 && !open && <div className="muted small">Nothing yet</div>}

      {entries.map((e) => (
        <div className="feed-item" key={e.id}>
          <div style={{ fontSize: 14 }}>{e.text}</div>
          <div className="feed-meta">{e.author} · {timeAgo(e.created_at)}</div>
        </div>
      ))}

      {open && (
        <div style={{ marginTop: 8 }}>
          <textarea
            className="input"
            rows={2}
            autoFocus
            placeholder={meta.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={!text.trim()}>Add</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setText(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
