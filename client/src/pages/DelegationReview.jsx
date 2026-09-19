import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveData } from '../hooks/useLiveData.js';
import { Review } from '../lib/resources.js';
import EditableField from '../components/EditableField.jsx';

export default function DelegationReview() {
  const { data, refresh } = useLiveData(() => Review.get(), []);
  const [generating, setGenerating] = useState(false);

  if (!data) return <div className="page"><div className="empty-state">Loading…</div></div>;

  const { settings, workstreamSummaries, followupPlan, openInsights } = data;

  const generate = async () => {
    setGenerating(true);
    await Review.generateExecSummary();
    setGenerating(false);
    refresh(true);
  };

  const editSummary = async (text) => {
    await Review.editExecSummary(text);
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Delegation Review</h1>
        <div className="sub">{settings.delegation_name}</div>
      </div>

      <div className="card">
        <div className="row-between">
          <div className="card-title">Executive Summary</div>
          <button className="btn btn-sm" onClick={generate} disabled={generating}>
            {generating ? '…' : settings.exec_summary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        {settings.exec_summary ? (
          <EditableField multiline value={settings.exec_summary} onSave={editSummary} />
        ) : (
          <div className="muted small">Generate a summary once you have some days logged.</div>
        )}
      </div>

      <div className="section-heading">By Workstream</div>
      {workstreamSummaries.map((ws) => (
        <div className="card" key={ws.id}>
          <div className="card-title">{ws.name}</div>
          {!ws.hasContent ? (
            <div className="muted small">No activity logged.</div>
          ) : (
            <div className="stack" style={{ marginTop: 6 }}>
              <ReviewList label="What we did" items={ws.whatWeDid.map((n) => n.text)} />
              <ReviewList label="Findings" items={ws.findings.map((n) => n.text)} />
              <ReviewList label="Field feedback" items={ws.feedback.map((f) => f.observation)} />
              <ReviewList label="Problems" items={ws.problems.map((n) => n.text)} />
              <ReviewList label="Decisions" items={ws.decisions.map((n) => n.text)} />
              <ReviewList label="Recommendations" items={ws.recommendations.map((r) => r.title)} />
              <ReviewList label="Open tasks / next steps" items={ws.openTasks.map((t) => t.title)} />
            </div>
          )}
        </div>
      ))}

      {openInsights.length > 0 && (
        <>
          <div className="section-heading">Open Opportunities & Partnerships</div>
          <div className="card">
            <ReviewList label="" items={openInsights.map((i) => `[${i.tag}] ${i.title}`)} />
          </div>
        </>
      )}

      <div className="section-heading">Follow-up Plan</div>
      <div className="card">
        <div className="card-title">Immediate</div>
        <ReviewList label="" items={followupPlan.immediate.map((t) => t.title)} empty="None" />
        <div className="divider" />
        <div className="card-title">Short Term</div>
        <ReviewList label="" items={followupPlan.short.map((t) => t.title)} empty="None" />
        <div className="divider" />
        <div className="card-title">Longer Term</div>
        <ReviewList label="" items={followupPlan.long.map((t) => t.title)} empty="None" />
      </div>

      <Link to="/export" className="btn btn-primary btn-block">Export Delegation →</Link>
    </div>
  );
}

function ReviewList({ label, items, empty }) {
  if (!items.length) {
    if (!empty) return null;
    return (
      <div>
        {label && <div className="small" style={{ fontWeight: 600 }}>{label}</div>}
        <div className="muted small">{empty}</div>
      </div>
    );
  }
  return (
    <div>
      {label && <div className="small" style={{ fontWeight: 600 }}>{label}</div>}
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {items.map((t, i) => <li key={i} className="small">{t}</li>)}
      </ul>
    </div>
  );
}
