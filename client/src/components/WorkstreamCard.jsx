import { Link } from 'react-router-dom';

export default function WorkstreamCard({ ws }) {
  return (
    <Link to={`/workstreams/${ws.id}`} className="card-link">
      <div className="card">
        <div className="row-between">
          <div className="card-title">{ws.name}</div>
          <span className="badge">{ws.openTaskCount} open</span>
        </div>
        {ws.latestUpdate && <div className="small" style={{ marginTop: 4 }}>{truncate(ws.latestUpdate)}</div>}
        {ws.unresolvedItem && (
          <div className="small badge-amber" style={{ marginTop: 8, display: 'inline-block', padding: '3px 10px', borderRadius: 999 }}>
            ⚠ {truncate(ws.unresolvedItem, 60)}
          </div>
        )}
        {!ws.latestUpdate && !ws.unresolvedItem && <div className="muted small" style={{ marginTop: 4 }}>No activity yet</div>}
      </div>
    </Link>
  );
}

function truncate(text, len = 90) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len - 1) + '…' : text;
}
