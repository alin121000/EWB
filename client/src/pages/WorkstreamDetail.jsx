import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Workstreams, Tasks } from '../lib/resources.js';
import { emit } from '../lib/bus.js';
import TaskRow from '../components/TaskRow.jsx';
import EditableField from '../components/EditableField.jsx';
import { timeAgo } from '../lib/format.js';

export default function WorkstreamDetail() {
  const { id } = useParams();
  const { data: ws, refresh: refreshWs } = useLiveData(() => Workstreams.get(id), [id]);
  const { data: feed, refresh: refreshFeed } = useLiveData(() => Workstreams.feed(id), [id]);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [question, setQuestion] = useState('');

  if (!ws || !feed) return <div className="page"><div className="empty-state">Loading…</div></div>;

  const saveField = async (field, value) => {
    await Workstreams.update(ws.id, { [field]: value });
    emit('data-changed');
    refreshWs(true);
  };

  const setStatus = async (status) => {
    await Workstreams.update(ws.id, { key_question_status: status });
    refreshWs(true);
  };

  const toggleTask = async (task) => {
    await Tasks.update(task.id, { done: !task.done });
    emit('data-changed');
    refreshFeed(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <Link to="/workstreams" className="small muted">← Workstreams</Link>
        <h1 style={{ marginTop: 4 }}>
          <EditableField value={ws.name} onSave={(v) => saveField('name', v)} />
        </h1>
      </div>

      <div className="card">
        <div className="card-title">Description</div>
        <EditableField multiline value={ws.description} placeholder="What this workstream covers" onSave={(v) => saveField('description', v)} />
      </div>

      {(ws.key_question || editingQuestion) && (
        <div className="card">
          <div className="card-title">Key open question</div>
          <EditableField
            value={ws.key_question}
            placeholder="e.g. Is suitable space available?"
            onSave={(v) => saveField('key_question', v)}
          />
          <div className="row" style={{ marginTop: 10 }}>
            {['unknown', 'yes', 'no'].map((s) => (
              <button
                key={s}
                className={`chip ${ws.key_question_status === s ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setStatus(s)}
              >
                {s === 'unknown' ? 'Unclear' : s === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
      )}
      {!ws.key_question && !editingQuestion && (
        <button className="btn btn-ghost" onClick={() => setEditingQuestion(true)}>+ Track a key open question</button>
      )}

      <div className="section-heading">Open Tasks ({feed.tasks.filter((t) => !t.done).length})</div>
      <div className="card">
        {feed.tasks.filter((t) => !t.done).length === 0 && <div className="empty-state">No open tasks.</div>}
        {feed.tasks.filter((t) => !t.done).map((t) => (
          <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} />
        ))}
      </div>

      <div className="section-heading">Field Feedback ({feed.feedback.length})</div>
      <div className="card">
        {feed.feedback.length === 0 && <div className="empty-state">No feedback logged yet.</div>}
        {feed.feedback.map((f) => (
          <div className="feed-item" key={f.id}>
            <div style={{ fontSize: 14 }}>{f.observation}</div>
            {f.suggested_change && <div className="small muted">Suggested: {f.suggested_change}</div>}
            <div className="feed-meta">{f.author} · {timeAgo(f.created_at)} {f.requires_followup ? '· needs follow-up' : ''}</div>
          </div>
        ))}
      </div>

      <div className="section-heading">Findings & Notes</div>
      <div className="card">
        {feed.entries.length === 0 && <div className="empty-state">No notes tagged to this workstream yet.</div>}
        {feed.entries.map((e) => (
          <div className="feed-item" key={e.id}>
            <div style={{ fontSize: 14 }}>{e.text}</div>
            <div className="feed-meta">{e.section} · {e.author} · {timeAgo(e.created_at)}</div>
          </div>
        ))}
      </div>

      <div className="section-heading">Meetings ({feed.meetings.length})</div>
      <div className="card">
        {feed.meetings.length === 0 && <div className="empty-state">No meetings logged yet.</div>}
        {feed.meetings.map((m) => (
          <div className="feed-item" key={m.id}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{m.person_org}</div>
            {m.notes && <div className="small">{m.notes}</div>}
            <div className="feed-meta">{m.date} · {m.author}</div>
          </div>
        ))}
      </div>

      <div className="section-heading">Insights ({feed.insights.length})</div>
      <div className="card">
        {feed.insights.length === 0 && <div className="empty-state">No insights yet.</div>}
        {feed.insights.map((i) => (
          <div className="feed-item" key={i.id}>
            <div className="row gap-sm"><span className="badge badge-gray">{i.tag}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{i.title}</span></div>
            {i.description && <div className="small">{i.description}</div>}
          </div>
        ))}
      </div>

      <div className="section-heading">Photos ({feed.photos.length})</div>
      {feed.photos.length === 0 ? (
        <div className="card"><div className="empty-state">No photos yet.</div></div>
      ) : (
        <div className="photo-grid">
          {feed.photos.map((p) => (
            <img key={p.id} src={`/uploads/${p.filename}`} alt={p.caption} />
          ))}
        </div>
      )}
    </div>
  );
}
