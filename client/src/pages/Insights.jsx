import { useMemo, useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Insights } from '../lib/resources.js';
import { useWorkstreamsMap } from '../hooks/useWorkstreamsMap.js';
import { emit } from '../lib/bus.js';
import { toast } from '../components/Toast.jsx';

const TAGS = ['Insight', 'Opportunity', 'Need', 'Problem', 'Recommendation', 'Follow-up', 'Partnership'];

export default function InsightsPage() {
  const [tag, setTag] = useState('');
  const [workstream, setWorkstream] = useState('');
  const { list: workstreams, nameFor } = useWorkstreamsMap();

  const filters = useMemo(() => ({ tag: tag || undefined, workstream: workstream || undefined }), [tag, workstream]);
  const { data, refresh } = useLiveData(() => Insights.list(filters), [tag, workstream]);

  const convert = async (ins) => {
    await Insights.convertToTask(ins.id);
    emit('data-changed');
    toast('Converted to task');
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Insights & Opportunities</h1>
      </div>

      <div className="chip-row">
        <button className={`chip ${tag === '' ? 'active' : ''}`} onClick={() => setTag('')}>All</button>
        {TAGS.map((t) => (
          <button key={t} className={`chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>
        ))}
      </div>
      <div className="field">
        <select className="input" value={workstream} onChange={(e) => setWorkstream(e.target.value)}>
          <option value="">All workstreams</option>
          {workstreams.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className="stack">
        {(!data || data.length === 0) && <div className="card"><div className="empty-state">Nothing here yet.</div></div>}
        {data?.map((ins) => (
          <div className="card" key={ins.id}>
            <div className="row gap-sm">
              <span className="badge">{ins.tag}</span>
              <span className="badge badge-gray">{nameFor(ins.workstream_id)}</span>
            </div>
            <div className="card-title" style={{ marginTop: 8 }}>{ins.title}</div>
            {ins.description && <div className="small">{ins.description}</div>}
            {!ins.converted_task_id ? (
              <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => convert(ins)}>+ Convert to Task</button>
            ) : (
              <div className="small" style={{ marginTop: 8, color: 'var(--green-dark)' }}>✓ Converted to task</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
