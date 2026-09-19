import { useMemo, useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Photos, Days } from '../lib/resources.js';
import { useWorkstreamsMap } from '../hooks/useWorkstreamsMap.js';

export default function PhotosPage() {
  const [workstream, setWorkstream] = useState('');
  const [day, setDay] = useState('');
  const [active, setActive] = useState(null);
  const { list: workstreams, nameFor } = useWorkstreamsMap();
  const { data: days } = useLiveData(() => Days.list(), []);

  const filters = useMemo(() => ({ workstream: workstream || undefined, day: day || undefined }), [workstream, day]);
  const { data } = useLiveData(() => Photos.list(filters), [workstream, day]);

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Photos</h1>
      </div>
      <div className="row">
        <select className="input" value={workstream} onChange={(e) => setWorkstream(e.target.value)}>
          <option value="">All workstreams</option>
          {workstreams.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select className="input" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">All days</option>
          {(days || []).map((d) => <option key={d.id} value={d.id}>Day {d.day_number}</option>)}
        </select>
      </div>

      {(!data || data.length === 0) ? (
        <div className="card" style={{ marginTop: 12 }}><div className="empty-state">No photos yet.</div></div>
      ) : (
        <div className="photo-grid" style={{ marginTop: 12 }}>
          {data.map((p) => (
            <img key={p.id} src={`/uploads/${p.filename}`} alt={p.caption} onClick={() => setActive(p)} />
          ))}
        </div>
      )}

      {active && (
        <div className="sheet-backdrop" onClick={() => setActive(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <img src={`/uploads/${active.filename}`} alt={active.caption} style={{ width: '100%', borderRadius: 14 }} />
            {active.caption && <div style={{ marginTop: 10 }}>{active.caption}</div>}
            <div className="small muted" style={{ marginTop: 6 }}>{nameFor(active.workstream_id)} · {active.author}</div>
          </div>
        </div>
      )}
    </div>
  );
}
