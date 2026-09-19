import { Link } from 'react-router-dom';

const items = [
  { to: '/feedback', icon: '💬', label: 'Field Feedback', desc: 'All structured feedback from the field' },
  { to: '/insights', icon: '💡', label: 'Insights & Opportunities', desc: 'Things worth remembering that aren’t tasks' },
  { to: '/meetings', icon: '🤝', label: 'Meetings', desc: 'Who we met and what was agreed' },
  { to: '/photos', icon: '📷', label: 'Photos', desc: 'All delegation photos' },
  { to: '/search', icon: '🔍', label: 'Search', desc: 'Search notes, feedback, tasks, meetings, insights' },
  { to: '/review', icon: '📋', label: 'Delegation Review', desc: 'Final summary and follow-up plan' },
  { to: '/export', icon: '📤', label: 'Export Delegation', desc: 'Build a shareable document' },
];

export default function More() {
  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>More</h1>
      </div>
      <div className="stack">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="card-link">
            <div className="card row" style={{ gap: 14 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div className="card-title">{item.label}</div>
                <div className="small muted">{item.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
