import { useMemo, useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Feedback } from '../lib/resources.js';
import { useWorkstreamsMap } from '../hooks/useWorkstreamsMap.js';
import { emit } from '../lib/bus.js';
import { toast } from '../components/Toast.jsx';
import { timeAgo } from '../lib/format.js';

export default function FieldFeedback() {
  const [workstream, setWorkstream] = useState('');
  const [followupOnly, setFollowupOnly] = useState(false);
  const { list: workstreams, nameFor } = useWorkstreamsMap();

  const filters = useMemo(
    () => ({ workstream: workstream || undefined, requires_followup: followupOnly ? '1' : undefined }),
    [workstream, followupOnly]
  );
  const { data, refresh } = useLiveData(() => Feedback.list(filters), [workstream, followupOnly]);

  const makeTask = async (fb) => {
    await Feedback.createTask(fb.id);
    emit('data-changed');
    toast('Task created');
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Field Feedback</h1>
        <div className="sub">Use the + button to add new feedback in under a minute.</div>
      </div>

      <div className="chip-row">
        <button className={`chip ${followupOnly ? 'active' : ''}`} onClick={() => setFollowupOnly((v) => !v)}>
          Needs follow-up
        </button>
      </div>
      <div className="field">
        <select className="input" value={workstream} onChange={(e) => setWorkstream(e.target.value)}>
          <option value="">All workstreams</option>
          {workstreams.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className="stack">
        {(!data || data.length === 0) && <div className="card"><div className="empty-state">No feedback yet.</div></div>}
        {data?.map((fb) => (
          <div className="card" key={fb.id}>
            <div className="row-between">
              <span className="badge badge-gray">{nameFor(fb.workstream_id)}</span>
              {fb.requires_followup && <span className="badge badge-amber">Follow-up needed</span>}
            </div>
            {fb.source_text && <div className="small muted" style={{ marginTop: 6 }}>From: {fb.source_text}</div>}
            <div style={{ marginTop: 6 }}>{fb.observation}</div>
            {fb.works_well && <div className="small" style={{ marginTop: 4 }}>✅ {fb.works_well}</div>}
            {fb.not_working && <div className="small" style={{ marginTop: 4 }}>⚠️ {fb.not_working}</div>}
            {fb.suggested_change && <div className="small" style={{ marginTop: 4 }}>💡 {fb.suggested_change}</div>}
            <div className="feed-meta" style={{ marginTop: 8 }}>{fb.author} · {timeAgo(fb.created_at)}</div>
            {fb.requires_followup && !fb.task_id && (
              <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => makeTask(fb)}>+ Create Task</button>
            )}
            {fb.task_id && <div className="small" style={{ marginTop: 8, color: 'var(--green-dark)' }}>✓ Task created</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
