import { useState } from 'react';
import { Search } from '../lib/resources.js';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (value) => {
    if (!value.trim()) {
      setResults(null);
      return;
    }
    setBusy(true);
    const data = await Search.run(value.trim());
    setResults(data);
    setBusy(false);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Search</h1>
      </div>
      <div className="field">
        <input
          className="input"
          autoFocus
          placeholder="Search notes, feedback, tasks, meetings, insights…"
          value={q}
          onChange={(e) => { setQ(e.target.value); run(e.target.value); }}
        />
      </div>

      {busy && <div className="muted small">Searching…</div>}

      {results && (
        <div className="stack">
          <ResultGroup title="Notes" items={results.notes} render={(n) => n.text} />
          <ResultGroup title="Feedback" items={results.feedback} render={(f) => f.observation} />
          <ResultGroup title="Tasks" items={results.tasks} render={(t) => t.title} />
          <ResultGroup title="Meetings" items={results.meetings} render={(m) => `${m.person_org} — ${m.notes || ''}`} />
          <ResultGroup title="Insights" items={results.insights} render={(i) => i.title} />
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, items, render }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {items.map((item) => (
        <div className="feed-item" key={item.id}>{render(item)}</div>
      ))}
    </div>
  );
}
