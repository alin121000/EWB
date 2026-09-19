import { useEffect, useState } from 'react';
import { Days, Feedback, Insights, Meetings, Photos, Tasks } from '../lib/resources.js';
import { emit } from '../lib/bus.js';
import { toast } from './Toast.jsx';
import { getLastWorkstream, setLastWorkstream } from '../lib/prefs.js';
import WorkstreamSelect from './WorkstreamSelect.jsx';

const MENU = [
  { key: 'feedback', icon: '💬', label: 'Field Feedback' },
  { key: 'task', icon: '✅', label: 'Task' },
  { key: 'note', icon: '📝', label: 'Daily Note' },
  { key: 'insight', icon: '💡', label: 'Insight' },
  { key: 'photo', icon: '📷', label: 'Photo' },
  { key: 'meeting', icon: '🤝', label: 'Meeting' },
  { key: 'idea', icon: '✨', label: 'Idea' },
];

export default function QuickAddSheet({ open, onClose }) {
  const [mode, setMode] = useState('menu');
  const [today, setToday] = useState(null);

  useEffect(() => {
    if (open) {
      setMode('menu');
      Days.today().then(setToday).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const close = () => {
    setMode('menu');
    onClose();
  };

  const saved = (msg = 'Saved') => {
    emit('data-changed');
    toast(msg);
    close();
  };

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {mode === 'menu' && (
          <>
            <div className="sheet-header">
              <h2>What do you want to capture?</h2>
              <button className="icon-btn" onClick={close}>✕</button>
            </div>
            <div className="quick-grid">
              {MENU.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)}>
                  <span className="icon">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'note' && <NoteForm day={today} onBack={() => setMode('menu')} onSaved={saved} />}
        {mode === 'task' && <TaskForm onBack={() => setMode('menu')} onSaved={saved} />}
        {mode === 'feedback' && <FeedbackForm day={today} onBack={() => setMode('menu')} onSaved={saved} />}
        {(mode === 'insight' || mode === 'idea') && (
          <InsightForm quick={mode === 'idea'} onBack={() => setMode('menu')} onSaved={saved} />
        )}
        {mode === 'meeting' && <MeetingForm day={today} onBack={() => setMode('menu')} onSaved={saved} />}
        {mode === 'photo' && <PhotoForm day={today} onBack={() => setMode('menu')} onSaved={saved} />}
      </div>
    </div>
  );
}

function FormShell({ title, onBack, children }) {
  return (
    <>
      <div className="sheet-header">
        <button className="icon-btn" onClick={onBack}>←</button>
        <h2>{title}</h2>
        <span style={{ width: 28 }} />
      </div>
      {children}
    </>
  );
}

function NoteForm({ day, onBack, onSaved }) {
  const [text, setText] = useState('');
  const [ws, setWs] = useState(getLastWorkstream());
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim() || !day) return;
    setBusy(true);
    await Days.addEntry(day.id, { section: 'note', text, workstream_id: ws || null });
    setLastWorkstream(ws);
    setBusy(false);
    onSaved();
  };

  return (
    <FormShell title="Daily Note" onBack={onBack}>
      <div className="field">
        <label>What happened / what did you notice?</label>
        <textarea className="input" autoFocus rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <WorkstreamSelect value={ws} onChange={setWs} />
      <button className="btn btn-primary btn-block" disabled={!text.trim() || busy} onClick={submit}>
        Save Note
      </button>
    </FormShell>
  );
}

function TaskForm({ onBack, onSaved }) {
  const [title, setTitle] = useState('');
  const [ws, setWs] = useState(getLastWorkstream());
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await Tasks.create({ title, workstream_id: ws || null, owner, due_date: dueDate });
    setLastWorkstream(ws);
    setBusy(false);
    onSaved();
  };

  return (
    <FormShell title="New Task" onBack={onBack}>
      <div className="field">
        <label>Task</label>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen?" />
      </div>
      <WorkstreamSelect value={ws} onChange={setWs} />
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Owner (optional)</label>
          <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Due (optional)</label>
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary btn-block" disabled={!title.trim() || busy} onClick={submit}>
        Add Task
      </button>
    </FormShell>
  );
}

function FeedbackForm({ day, onBack, onSaved }) {
  const [ws, setWs] = useState(getLastWorkstream());
  const [source, setSource] = useState('');
  const [observation, setObservation] = useState('');
  const [worksWell, setWorksWell] = useState('');
  const [notWorking, setNotWorking] = useState('');
  const [suggested, setSuggested] = useState('');
  const [needsFollowup, setNeedsFollowup] = useState(false);
  const [createTask, setCreateTask] = useState(true);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!observation.trim()) return;
    setBusy(true);
    await Feedback.create({
      workstream_id: ws || null,
      source_text: source,
      observation,
      works_well: worksWell,
      not_working: notWorking,
      suggested_change: suggested,
      requires_followup: needsFollowup,
      create_task: needsFollowup && createTask,
      day_id: day?.id,
    });
    setLastWorkstream(ws);
    setBusy(false);
    onSaved(needsFollowup && createTask ? 'Feedback saved + task created' : 'Feedback saved');
  };

  return (
    <FormShell title="Field Feedback" onBack={onBack}>
      <WorkstreamSelect value={ws} onChange={setWs} />
      <div className="field">
        <label>Who / where is this from?</label>
        <input className="input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Student at ALYN workshop" />
      </div>
      <div className="field">
        <label>What did we observe / hear?</label>
        <textarea
          className="input"
          autoFocus
          rows={3}
          placeholder="What did we see or hear?"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
        />
      </div>

      {!more && (
        <button className="btn btn-ghost" onClick={() => setMore(true)}>+ Add more detail (optional)</button>
      )}
      {more && (
        <>
          <div className="field">
            <label>What works well? (optional)</label>
            <textarea className="input" rows={2} value={worksWell} onChange={(e) => setWorksWell(e.target.value)} />
          </div>
          <div className="field">
            <label>What's not working? (optional)</label>
            <textarea className="input" rows={2} value={notWorking} onChange={(e) => setNotWorking(e.target.value)} />
          </div>
          <div className="field">
            <label>Suggested change / need (optional)</label>
            <textarea className="input" rows={2} value={suggested} onChange={(e) => setSuggested(e.target.value)} />
          </div>
        </>
      )}

      <label className="row" style={{ margin: '14px 0' }}>
        <input type="checkbox" checked={needsFollowup} onChange={(e) => setNeedsFollowup(e.target.checked)} style={{ width: 20, height: 20 }} />
        <span>Does this require follow-up?</span>
      </label>
      {needsFollowup && (
        <label className="row" style={{ margin: '0 0 14px' }}>
          <input type="checkbox" checked={createTask} onChange={(e) => setCreateTask(e.target.checked)} style={{ width: 20, height: 20 }} />
          <span>Create a task from this now</span>
        </label>
      )}

      <button className="btn btn-primary btn-block" disabled={!observation.trim() || busy} onClick={submit}>
        Save Feedback
      </button>
    </FormShell>
  );
}

const TAGS = ['Insight', 'Opportunity', 'Need', 'Problem', 'Recommendation', 'Follow-up', 'Partnership'];

function InsightForm({ quick, onBack, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ws, setWs] = useState(getLastWorkstream());
  const [tag, setTag] = useState('Insight');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await Insights.create({ title, description, workstream_id: ws || null, tag: quick ? 'Insight' : tag });
    setLastWorkstream(ws);
    setBusy(false);
    onSaved();
  };

  return (
    <FormShell title={quick ? 'Quick Idea' : 'Insight'} onBack={onBack}>
      <div className="field">
        <label>Title</label>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" />
      </div>
      <div className="field">
        <label>Description (optional)</label>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {!quick && (
        <div className="field">
          <label>Tag</label>
          <select className="input" value={tag} onChange={(e) => setTag(e.target.value)}>
            {TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
      <WorkstreamSelect value={ws} onChange={setWs} />
      <button className="btn btn-primary btn-block" disabled={!title.trim() || busy} onClick={submit}>
        Save
      </button>
    </FormShell>
  );
}

function MeetingForm({ day, onBack, onSaved }) {
  const [personOrg, setPersonOrg] = useState('');
  const [role, setRole] = useState('');
  const [ws, setWs] = useState(getLastWorkstream());
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState('');
  const [followup, setFollowup] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!personOrg.trim()) return;
    setBusy(true);
    await Meetings.create({
      person_org: personOrg,
      role,
      workstream_id: ws || null,
      notes,
      agreed,
      followup,
      date: day?.date,
      day_id: day?.id,
    });
    setLastWorkstream(ws);
    setBusy(false);
    onSaved();
  };

  return (
    <FormShell title="Meeting" onBack={onBack}>
      <div className="field">
        <label>Person / organization</label>
        <input className="input" autoFocus value={personOrg} onChange={(e) => setPersonOrg(e.target.value)} />
      </div>
      <div className="field">
        <label>Role (optional)</label>
        <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <WorkstreamSelect value={ws} onChange={setWs} />
      <div className="field">
        <label>Notes</label>
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="field">
        <label>What was agreed? (optional)</label>
        <textarea className="input" rows={2} value={agreed} onChange={(e) => setAgreed(e.target.value)} />
      </div>
      <div className="field">
        <label>Follow-up (optional)</label>
        <textarea className="input" rows={2} value={followup} onChange={(e) => setFollowup(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" disabled={!personOrg.trim() || busy} onClick={submit}>
        Save Meeting
      </button>
    </FormShell>
  );
}

function PhotoForm({ day, onBack, onSaved }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [ws, setWs] = useState(getLastWorkstream());
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    await Photos.upload(file, { caption, workstream_id: ws || '', day_id: day?.id || '' });
    setLastWorkstream(ws);
    setBusy(false);
    onSaved();
  };

  return (
    <FormShell title="Photo" onBack={onBack}>
      {!preview && (
        <label className="btn btn-block" style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}>
          📷 Take or choose a photo
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={pick} />
        </label>
      )}
      {preview && (
        <img src={preview} alt="preview" style={{ width: '100%', borderRadius: 14, marginBottom: 12, maxHeight: 280, objectFit: 'cover' }} />
      )}
      <div className="field">
        <label>Caption (optional)</label>
        <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Short caption" />
      </div>
      <WorkstreamSelect value={ws} onChange={setWs} />
      <button className="btn btn-primary btn-block" disabled={!file || busy} onClick={submit}>
        Save Photo
      </button>
    </FormShell>
  );
}
