import { useMemo, useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Tasks } from '../lib/resources.js';
import { useWorkstreamsMap } from '../hooks/useWorkstreamsMap.js';
import { emit } from '../lib/bus.js';
import { formatDate } from '../lib/format.js';

const STATUS_CHIPS = [
  { key: 'open', label: 'Open' },
  { key: 'done', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export default function TasksPage() {
  const [status, setStatus] = useState('open');
  const [workstream, setWorkstream] = useState('');
  const [afterOnly, setAfterOnly] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const { list: workstreams, nameFor } = useWorkstreamsMap();

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      workstream: workstream || undefined,
      after_delegation: afterOnly ? '1' : undefined,
    }),
    [status, workstream, afterOnly]
  );

  const { data, refresh } = useLiveData(() => Tasks.list(filters), [status, workstream, afterOnly]);

  const toggle = async (task) => {
    await Tasks.update(task.id, { done: !task.done });
    emit('data-changed');
    refresh(true);
  };

  const move = async (index, dir) => {
    if (!data) return;
    const items = [...data];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    await Tasks.reorder(items.map((t) => t.id));
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Tasks</h1>
      </div>

      <div className="chip-row">
        {STATUS_CHIPS.map((c) => (
          <button key={c.key} className={`chip ${status === c.key ? 'active' : ''}`} onClick={() => setStatus(c.key)}>
            {c.label}
          </button>
        ))}
        <button className={`chip ${afterOnly ? 'active' : ''}`} onClick={() => setAfterOnly((v) => !v)}>
          After Delegation
        </button>
      </div>

      <div className="field">
        <select className="input" value={workstream} onChange={(e) => setWorkstream(e.target.value)}>
          <option value="">All workstreams</option>
          {workstreams.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {(!data || data.length === 0) && <div className="empty-state">No tasks here.</div>}
        {data?.map((task, i) => (
          <div key={task.id}>
            <div className="task-row" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
              <button
                className={`checkbox ${task.done ? 'checked' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggle(task); }}
              >
                {task.done ? '✓' : ''}
              </button>
              <div style={{ flex: 1 }}>
                <div className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</div>
                <div className="task-sub">
                  {nameFor(task.workstream_id)}{task.owner ? ` · ${task.owner}` : ''}{task.due_date ? ` · due ${formatDate(task.due_date)}` : ''}
                </div>
              </div>
              {!task.done && status === 'open' && !workstream && (
                <div className="stack gap-sm" onClick={(e) => e.stopPropagation()}>
                  <button className="icon-btn" style={{ padding: 2 }} onClick={() => move(i, -1)}>▲</button>
                  <button className="icon-btn" style={{ padding: 2 }} onClick={() => move(i, 1)}>▼</button>
                </div>
              )}
            </div>
            {expanded === task.id && <TaskEditor task={task} onChanged={() => { refresh(true); emit('data-changed'); }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskEditor({ task, onChanged }) {
  const [owner, setOwner] = useState(task.owner || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [note, setNote] = useState(task.note || '');
  const [after, setAfter] = useState(!!task.after_delegation);

  const save = async (overrides = {}) => {
    await Tasks.update(task.id, { owner, due_date: dueDate, note, after_delegation: after, ...overrides });
    onChanged();
  };

  const remove = async () => {
    await Tasks.remove(task.id);
    onChanged();
  };

  return (
    <div style={{ padding: '0 0 14px 34px' }}>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Owner</label>
          <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} onBlur={save} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Due date</label>
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} onBlur={save} />
        </div>
      </div>
      <div className="field">
        <label>Note</label>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} onBlur={save} />
      </div>
      <label className="row" style={{ marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={after}
          onChange={(e) => { setAfter(e.target.checked); save({ after_delegation: e.target.checked }); }}
          style={{ width: 20, height: 20 }}
        />
        <span className="small">Continue after delegation returns</span>
      </label>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
        <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>
      </div>
    </div>
  );
}
