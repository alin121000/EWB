import { useMemo, useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Meetings } from '../lib/resources.js';
import { useWorkstreamsMap } from '../hooks/useWorkstreamsMap.js';

export default function MeetingsPage() {
  const [workstream, setWorkstream] = useState('');
  const { list: workstreams, nameFor } = useWorkstreamsMap();
  const filters = useMemo(() => ({ workstream: workstream || undefined }), [workstream]);
  const { data } = useLiveData(() => Meetings.list(filters), [workstream]);

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Meetings</h1>
      </div>
      <div className="field">
        <select className="input" value={workstream} onChange={(e) => setWorkstream(e.target.value)}>
          <option value="">All workstreams</option>
          {workstreams.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div className="stack">
        {(!data || data.length === 0) && <div className="card"><div className="empty-state">No meetings logged yet.</div></div>}
        {data?.map((m) => (
          <div className="card" key={m.id}>
            <div className="row-between">
              <div className="card-title">{m.person_org}{m.role ? ` · ${m.role}` : ''}</div>
              <span className="badge badge-gray">{nameFor(m.workstream_id)}</span>
            </div>
            <div className="small muted">{m.date}</div>
            {m.notes && <div style={{ marginTop: 6 }}>{m.notes}</div>}
            {m.agreed && <div className="small" style={{ marginTop: 4 }}>🤝 Agreed: {m.agreed}</div>}
            {m.followup && <div className="small" style={{ marginTop: 4 }}>➡️ Follow-up: {m.followup}</div>}
            {m.contact && <div className="small muted" style={{ marginTop: 4 }}>Contact: {m.contact}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
