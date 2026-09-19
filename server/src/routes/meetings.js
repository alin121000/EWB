import { Router } from 'express';
import { db, id, now } from '../db.js';
import { getAuthor, todayISO } from '../lib/util.js';

const router = Router();

function ensureToday() {
  let day = db.prepare('SELECT * FROM days WHERE date = ?').get(todayISO());
  if (!day) {
    const m = db.prepare('SELECT COALESCE(MAX(day_number), 0) m FROM days').get().m;
    day = { id: id(), day_number: m + 1, date: todayISO(), locations: '', orgs_people: '', focus: '', created_at: now() };
    db.prepare(
      'INSERT INTO days (id, day_number, date, locations, orgs_people, focus, created_at) VALUES (@id, @day_number, @date, @locations, @orgs_people, @focus, @created_at)'
    ).run(day);
  }
  return day;
}

router.get('/', (req, res) => {
  const { workstream, q } = req.query;
  let sql = 'SELECT * FROM meetings WHERE 1=1';
  const params = [];
  if (workstream) {
    sql += ' AND workstream_id = ?';
    params.push(workstream);
  }
  if (q) {
    sql += ' AND (person_org LIKE ? OR notes LIKE ? OR agreed LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY date DESC, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const {
    person_org,
    role = '',
    date = todayISO(),
    workstream_id = null,
    notes = '',
    agreed = '',
    followup = '',
    contact = '',
    day_id = null,
  } = req.body;
  if (!person_org || !person_org.trim()) return res.status(400).json({ error: 'person_org required' });
  const day = day_id ? db.prepare('SELECT * FROM days WHERE id = ?').get(day_id) : ensureToday();
  const row = {
    id: id(),
    person_org: person_org.trim(),
    role,
    date,
    day_id: day ? day.id : null,
    workstream_id,
    notes,
    agreed,
    followup,
    contact,
    author: getAuthor(req),
    created_at: now(),
  };
  db.prepare(
    `INSERT INTO meetings (id, person_org, role, date, day_id, workstream_id, notes, agreed, followup, contact, author, created_at)
     VALUES (@id, @person_org, @role, @date, @day_id, @workstream_id, @notes, @agreed, @followup, @contact, @author, @created_at)`
  ).run(row);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'not found' });
  const fields = ['person_org', 'role', 'date', 'workstream_id', 'notes', 'agreed', 'followup', 'contact'];
  const next = { ...m };
  for (const f of fields) if (req.body[f] !== undefined) next[f] = req.body[f];
  db.prepare(
    `UPDATE meetings SET person_org=@person_org, role=@role, date=@date, workstream_id=@workstream_id, notes=@notes,
     agreed=@agreed, followup=@followup, contact=@contact WHERE id=@id`
  ).run(next);
  res.json(db.prepare('SELECT * FROM meetings WHERE id = ?').get(m.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
