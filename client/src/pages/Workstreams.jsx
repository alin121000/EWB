import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Workstreams } from '../lib/resources.js';
import { emit } from '../lib/bus.js';
import WorkstreamCard from '../components/WorkstreamCard.jsx';

export default function WorkstreamsPage() {
  const { data, refresh } = useLiveData(() => Workstreams.list(), []);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const submit = async () => {
    if (!name.trim()) return;
    await Workstreams.create({ name });
    setName('');
    setAdding(false);
    emit('data-changed');
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Workstreams</h1>
      </div>

      <div className="stack">
        {(data || []).map((ws) => (
          <WorkstreamCard key={ws.id} ws={ws} />
        ))}
      </div>

      {!adding && (
        <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>
          + Add workstream
        </button>
      )}
      {adding && (
        <div className="card">
          <div className="field">
            <label>New workstream name</label>
            <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!name.trim()} onClick={submit}>
              Add
            </button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
