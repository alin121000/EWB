import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { Days, Photos } from '../lib/resources.js';
import { emit } from '../lib/bus.js';
import { timeAgo } from '../lib/format.js';
import EditableField from '../components/EditableField.jsx';
import EntrySection from '../components/EntrySection.jsx';

export default function DailyLogDay() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const { data: day, refresh } = useLiveData(() => Days.get(dayId), [dayId]);
  const [noteText, setNoteText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (!day) return <div className="page"><div className="empty-state">Loading…</div></div>;

  const notes = day.entries.filter((e) => e.section === 'note');
  const byType = (type) => day.entries.filter((e) => e.section === type);

  const saveField = (field) => (value) => Days.update(day.id, { [field]: value }).then(() => refresh(true));

  const addEntry = async (section, text) => {
    await Days.addEntry(day.id, { section, text });
    emit('data-changed');
    refresh(true);
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    await addEntry('note', noteText.trim());
    setNoteText('');
  };

  const generate = async () => {
    setGenerating(true);
    await Days.generateUpdate(day.id);
    setGenerating(false);
    refresh(true);
  };

  const editUpdate = async (text) => {
    await Days.editUpdate(day.id, text);
    refresh(true);
  };

  const copyUpdate = () => {
    if (day.update?.edited_text) navigator.clipboard?.writeText(day.update.edited_text);
  };

  const addPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await Photos.upload(file, { day_id: day.id });
    emit('data-changed');
    refresh(true);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 4 }}>
        <div className="row-between">
          <Link to="/log" className="small muted">← Daily Log</Link>
          {!day.closed && (
            <button className="btn btn-sm" onClick={() => navigate(`/log/${day.id}/close`)}>Close Day</button>
          )}
        </div>
        <h1 style={{ marginTop: 4 }}>Day {day.day_number} – {new Date(day.date).toDateString()}</h1>
      </div>

      <div className="card">
        <div className="card-title">Main locations (optional)</div>
        <EditableField value={day.locations} placeholder="Where did we go today?" onSave={saveField('locations')} />
        <div className="divider" />
        <div className="card-title">Main organizations / people met (optional)</div>
        <EditableField value={day.orgs_people} placeholder="Who did we meet?" onSave={saveField('orgs_people')} />
      </div>

      <button className="btn btn-primary btn-block" onClick={generate} disabled={generating} style={{ marginBottom: 14 }}>
        {generating ? 'Generating…' : '✨ Generate Daily Update'}
      </button>

      {day.update && (
        <div className="card">
          <div className="row-between">
            <div className="card-title">Update for Israel</div>
            <span className="badge badge-gray">{day.update.source === 'ai' ? 'AI' : 'Template'}</span>
          </div>
          <EditableField multiline value={day.update.edited_text} onSave={editUpdate} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-sm" onClick={copyUpdate}>Copy</button>
            <button className="btn btn-sm" onClick={generate}>Regenerate</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? 'Hide raw notes' : 'View raw notes'}
            </button>
          </div>
          {showRaw && <pre className="update-text" style={{ marginTop: 10 }}>{day.update.raw_snapshot}</pre>}
        </div>
      )}

      <div className="section-heading">What happened today?</div>
      <div className="card">
        {notes.map((n) => (
          <div className="feed-item" key={n.id}>
            <div style={{ fontSize: 15 }}>{n.text}</div>
            <div className="feed-meta">{n.author} · {timeAgo(n.created_at)}</div>
          </div>
        ))}
        {notes.length === 0 && <div className="muted small">No notes yet — write the first one below.</div>}
        <div className="divider" />
        <textarea
          className="input"
          rows={3}
          placeholder="Quick note…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={!noteText.trim()} onClick={submitNote}>
          Add Note
        </button>
      </div>

      <EntrySection section="meeting" entries={byType('meeting')} onAdd={(t) => addEntry('meeting', t)} />
      <EntrySection section="finding" entries={byType('finding')} onAdd={(t) => addEntry('finding', t)} />
      <EntrySection section="decision" entries={byType('decision')} onAdd={(t) => addEntry('decision', t)} />
      <EntrySection section="problem" entries={byType('problem')} onAdd={(t) => addEntry('problem', t)} />
      <EntrySection section="followup" entries={byType('followup')} onAdd={(t) => addEntry('followup', t)} />

      <div className="section-heading">Photos</div>
      <div className="card">
        {day.photos?.length > 0 && (
          <div className="photo-grid" style={{ marginBottom: 10 }}>
            {day.photos.map((p) => (
              <img key={p.id} src={`/uploads/${p.filename}`} alt={p.caption} />
            ))}
          </div>
        )}
        <label className="btn btn-block" style={{ border: '1px dashed var(--border)' }}>
          📷 Add photo
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={addPhoto} />
        </label>
      </div>
    </div>
  );
}
