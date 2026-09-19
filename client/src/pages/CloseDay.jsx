import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Days } from '../lib/resources.js';
import { emit } from '../lib/bus.js';
import { toast } from '../components/Toast.jsx';

export default function CloseDay() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const { data, refresh } = useLiveData(() => Days.review(dayId), [dayId]);
  const [generating, setGenerating] = useState(false);

  if (!data) return <div className="page"><div className="empty-state">Loading…</div></div>;

  const { day, entries, tasksCreatedToday, feedbackToday, insightsToday, meetingsToday, photosToday } = data;
  const findings = entries.filter((e) => e.section === 'finding');
  const problems = entries.filter((e) => e.section === 'problem');
  const followups = entries.filter((e) => e.section === 'followup');

  const generateAndFinish = async () => {
    setGenerating(true);
    await Days.generateUpdate(day.id);
    await Days.update(day.id, { closed: true });
    setGenerating(false);
    emit('data-changed');
    toast('Day closed');
    navigate(`/log/${day.id}`);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <Link to={`/log/${day.id}`} className="small muted">← Back to Day {day.day_number}</Link>
        <h1 style={{ marginTop: 4 }}>Close Day {day.day_number}</h1>
        <div className="sub">Quick review before wrapping up</div>
      </div>

      <ReviewBlock title="What happened?" items={entries.filter((e) => e.section === 'note').map((e) => e.text)} empty="No notes captured — add one from the Daily Log page." />
      <ReviewBlock title="What did we learn?" items={findings.map((e) => e.text)} empty="No findings logged." />
      <ReviewBlock title="What needs action?" items={[...tasksCreatedToday.map((t) => t.title), ...followups.map((f) => f.text)]} empty="No new tasks or follow-ups today." />
      <ReviewBlock title="What remains unresolved?" items={problems.map((e) => e.text)} empty="No open problems logged." />

      <div className="section-heading">Captured Today</div>
      <div className="card stack">
        <StatRow label="Tasks created" value={tasksCreatedToday.length} />
        <StatRow label="Field feedback" value={feedbackToday.length} />
        <StatRow label="Insights" value={insightsToday.length} />
        <StatRow label="Meetings" value={meetingsToday.length} />
        <StatRow label="Photos" value={photosToday.length} />
      </div>

      <div className="card">
        <div className="card-title">Important for tomorrow?</div>
        <div className="muted small">Set tomorrow's focus from Day {day.day_number + 1}'s log once it's created, or add a follow-up above.</div>
      </div>

      <button className="btn btn-primary btn-block" onClick={generateAndFinish} disabled={generating}>
        {generating ? 'Generating…' : 'Generate Daily Update & Close Day'}
      </button>
    </div>
  );
}

function ReviewBlock({ title, items, empty }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {items.length === 0 ? (
        <div className="muted small">{empty}</div>
      ) : (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {items.map((t, i) => (
            <li key={i} className="small" style={{ marginBottom: 4 }}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="row-between">
      <span className="small">{label}</span>
      <span className="badge">{value}</span>
    </div>
  );
}
