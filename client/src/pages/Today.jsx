import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Home, Days, Tasks } from '../lib/resources.js';
import { emit } from '../lib/bus.js';
import TaskRow from '../components/TaskRow.jsx';
import WorkstreamCard from '../components/WorkstreamCard.jsx';
import EditableField from '../components/EditableField.jsx';
import { timeAgo } from '../lib/format.js';

const TYPE_LABEL = { note: 'Note', feedback: 'Feedback', insight: 'Insight', meeting: 'Meeting' };
const TYPE_ICON = { note: '📝', feedback: '💬', insight: '💡', meeting: '🤝' };

export default function TodayPage() {
  const { data, refresh } = useLiveData(() => Home.get(), []);
  const [savingField, setSavingField] = useState(null);

  if (!data) return <div className="page"><div className="empty-state">Loading today…</div></div>;

  const { today, openTasks, latestUpdates, workstreamCards } = data;

  const saveDayField = async (field, value) => {
    setSavingField(field);
    await Days.update(today.id, { [field]: value });
    setSavingField(null);
    refresh(true);
  };

  const toggleTask = async (task) => {
    await Tasks.update(task.id, { done: !task.done });
    emit('data-changed');
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 4 }}>
        <h1>Day {today.day_number}</h1>
        <div className="sub">{new Date(today.date).toDateString()}</div>
      </div>

      <div className="card">
        <div className="card-title">Today's focus</div>
        <EditableField
          value={today.focus}
          placeholder="What's the main goal for today?"
          onSave={(v) => saveDayField('focus', v)}
          busy={savingField === 'focus'}
        />
        <div className="divider" />
        <div className="card-title">Current location / site</div>
        <EditableField
          value={today.locations}
          placeholder="Where are we right now?"
          onSave={(v) => saveDayField('locations', v)}
          busy={savingField === 'locations'}
        />
      </div>

      <div className="row-between">
        <div className="section-heading" style={{ margin: 0 }}>Open Tasks</div>
        <Link to="/tasks" className="small">See all</Link>
      </div>
      <div className="card">
        {openTasks.length === 0 && <div className="empty-state">No open tasks yet. Nice.</div>}
        {openTasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} />
        ))}
      </div>

      <div className="row-between">
        <div className="section-heading" style={{ margin: 0 }}>Latest Field Updates</div>
        <Link to="/search" className="small">Search</Link>
      </div>
      <div className="card">
        {latestUpdates.length === 0 && <div className="empty-state">Nothing captured yet — use + Add to get started.</div>}
        {latestUpdates.map((u) => (
          <div className="feed-item" key={`${u.type}-${u.id}`}>
            <div className="row gap-sm">
              <span>{TYPE_ICON[u.type]}</span>
              <span style={{ fontSize: 14 }}>{u.summary}</span>
            </div>
            <div className="feed-meta">{TYPE_LABEL[u.type]} · {u.author} · {timeAgo(u.created_at)}</div>
          </div>
        ))}
      </div>

      <div className="section-heading">Workstreams</div>
      <div className="stack">
        {workstreamCards.map((ws) => (
          <WorkstreamCard key={ws.id} ws={ws} />
        ))}
      </div>
    </div>
  );
}
