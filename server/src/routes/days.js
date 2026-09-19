import { Router } from 'express';
import { db, id, now } from '../db.js';
import { getAuthor, todayISO } from '../lib/util.js';
import { generateDailyUpdate } from '../lib/dailyUpdate.js';

const router = Router();

function nextDayNumber() {
  const m = db.prepare('SELECT COALESCE(MAX(day_number), 0) m FROM days').get().m;
  return m + 1;
}

function ensureToday() {
  let day = db.prepare('SELECT * FROM days WHERE date = ?').get(todayISO());
  if (!day) {
    const row = {
      id: id(),
      day_number: nextDayNumber(),
      date: todayISO(),
      locations: '',
      orgs_people: '',
      focus: '',
      created_at: now(),
    };
    db.prepare(
      'INSERT INTO days (id, day_number, date, locations, orgs_people, focus, created_at) VALUES (@id, @day_number, @date, @locations, @orgs_people, @focus, @created_at)'
    ).run(row);
    day = row;
  }
  return day;
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM days ORDER BY day_number ASC').all());
});

router.get('/today', (req, res) => {
  res.json(ensureToday());
});

router.post('/', (req, res) => {
  const { date, locations = '', orgs_people = '', focus = '' } = req.body;
  const d = date || todayISO();
  const existing = db.prepare('SELECT * FROM days WHERE date = ?').get(d);
  if (existing) return res.status(200).json(existing);
  const row = { id: id(), day_number: nextDayNumber(), date: d, locations, orgs_people, focus, created_at: now() };
  db.prepare(
    'INSERT INTO days (id, day_number, date, locations, orgs_people, focus, created_at) VALUES (@id, @day_number, @date, @locations, @orgs_people, @focus, @created_at)'
  ).run(row);
  res.status(201).json(row);
});

router.get('/:id', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not found' });
  const entries = db.prepare('SELECT * FROM day_entries WHERE day_id = ? ORDER BY created_at ASC').all(day.id);
  const update = db.prepare('SELECT * FROM daily_updates WHERE day_id = ?').get(day.id);
  const photos = db.prepare('SELECT * FROM photos WHERE day_id = ? ORDER BY created_at DESC').all(day.id);
  res.json({ ...day, entries, update: update || null, photos });
});

router.patch('/:id', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not found' });
  const { locations, orgs_people, focus, closed } = req.body;
  db.prepare('UPDATE days SET locations = ?, orgs_people = ?, focus = ?, closed = ? WHERE id = ?').run(
    locations !== undefined ? locations : day.locations,
    orgs_people !== undefined ? orgs_people : day.orgs_people,
    focus !== undefined ? focus : day.focus,
    closed !== undefined ? (closed ? 1 : 0) : day.closed,
    day.id
  );
  res.json(db.prepare('SELECT * FROM days WHERE id = ?').get(day.id));
});

router.post('/:id/entries', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not found' });
  const { section, text, workstream_id = null } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });
  const validSections = ['note', 'meeting', 'finding', 'decision', 'problem', 'followup'];
  const s = validSections.includes(section) ? section : 'note';
  const row = {
    id: id(),
    day_id: day.id,
    section: s,
    text: text.trim(),
    workstream_id,
    author: getAuthor(req),
    task_id: null,
    created_at: now(),
  };
  db.prepare(
    'INSERT INTO day_entries (id, day_id, section, text, workstream_id, author, task_id, created_at) VALUES (@id, @day_id, @section, @text, @workstream_id, @author, @task_id, @created_at)'
  ).run(row);
  res.status(201).json(row);
});

router.delete('/entries/:entryId', (req, res) => {
  db.prepare('DELETE FROM day_entries WHERE id = ?').run(req.params.entryId);
  res.status(204).end();
});

router.patch('/entries/:entryId', (req, res) => {
  const entry = db.prepare('SELECT * FROM day_entries WHERE id = ?').get(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'not found' });
  const { text, workstream_id } = req.body;
  db.prepare('UPDATE day_entries SET text = ?, workstream_id = ? WHERE id = ?').run(
    text !== undefined ? text : entry.text,
    workstream_id !== undefined ? workstream_id : entry.workstream_id,
    entry.id
  );
  res.json(db.prepare('SELECT * FROM day_entries WHERE id = ?').get(entry.id));
});

// Aggregated data for the Close Day review screen.
router.get('/:id/review', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not found' });
  const entries = db.prepare('SELECT * FROM day_entries WHERE day_id = ? ORDER BY created_at ASC').all(day.id);
  const tasksCreatedToday = db
    .prepare("SELECT * FROM tasks WHERE date(created_at) = ? ORDER BY created_at ASC")
    .all(day.date);
  const feedbackToday = db.prepare('SELECT * FROM feedback WHERE day_id = ? ORDER BY created_at ASC').all(day.id);
  const insightsToday = db
    .prepare('SELECT * FROM insights WHERE date(created_at) = ? ORDER BY created_at ASC')
    .all(day.date);
  const meetingsToday = db.prepare('SELECT * FROM meetings WHERE day_id = ? ORDER BY created_at ASC').all(day.id);
  const photosToday = db.prepare('SELECT * FROM photos WHERE day_id = ? ORDER BY created_at ASC').all(day.id);
  res.json({
    day,
    entries,
    tasksCreatedToday,
    feedbackToday,
    insightsToday,
    meetingsToday,
    photosToday,
  });
});

router.post('/:id/update/generate', async (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not found' });
  const entries = db.prepare('SELECT * FROM day_entries WHERE day_id = ? ORDER BY created_at ASC').all(day.id);
  const nextDay = db.prepare('SELECT * FROM days WHERE day_number = ?').get(day.day_number + 1);

  const { text, source, raw } = await generateDailyUpdate(day, entries, nextDay);

  const existing = db.prepare('SELECT * FROM daily_updates WHERE day_id = ?').get(day.id);
  const row = {
    id: existing ? existing.id : id(),
    day_id: day.id,
    raw_snapshot: raw,
    generated_text: text,
    edited_text: text,
    source,
    created_at: existing ? existing.created_at : now(),
    updated_at: now(),
  };
  if (existing) {
    db.prepare(
      'UPDATE daily_updates SET raw_snapshot=@raw_snapshot, generated_text=@generated_text, edited_text=@edited_text, source=@source, updated_at=@updated_at WHERE id=@id'
    ).run(row);
  } else {
    db.prepare(
      'INSERT INTO daily_updates (id, day_id, raw_snapshot, generated_text, edited_text, source, created_at, updated_at) VALUES (@id, @day_id, @raw_snapshot, @generated_text, @edited_text, @source, @created_at, @updated_at)'
    ).run(row);
  }
  res.json(row);
});

router.patch('/:id/update', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not found' });
  const existing = db.prepare('SELECT * FROM daily_updates WHERE day_id = ?').get(day.id);
  if (!existing) return res.status(404).json({ error: 'no update generated yet' });
  const { edited_text } = req.body;
  db.prepare('UPDATE daily_updates SET edited_text = ?, updated_at = ? WHERE id = ?').run(
    edited_text !== undefined ? edited_text : existing.edited_text,
    now(),
    existing.id
  );
  res.json(db.prepare('SELECT * FROM daily_updates WHERE id = ?').get(existing.id));
});

export default router;
