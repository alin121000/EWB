import { useWorkstreamsMap } from '../hooks/useWorkstreamsMap.js';
import { formatDate } from '../lib/format.js';

export default function TaskRow({ task, onToggle, onOpen }) {
  const { nameFor } = useWorkstreamsMap();
  const metaParts = [nameFor(task.workstream_id)];
  if (task.owner) metaParts.push(task.owner);
  if (task.due_date) metaParts.push(`due ${formatDate(task.due_date)}`);
  if (task.after_delegation) metaParts.push('after delegation');

  return (
    <div className="task-row" onClick={onOpen}>
      <button
        className={`checkbox ${task.done ? 'checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        aria-label="toggle done"
      >
        {task.done ? '✓' : ''}
      </button>
      <div style={{ flex: 1 }}>
        <div className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</div>
        <div className="task-sub">{metaParts.join(' · ')}</div>
      </div>
    </div>
  );
}
