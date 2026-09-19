import { Router } from 'express';
import { db, id, now } from '../db.js';
import { getAuthor } from '../lib/util.js';
import { summarizeWorkstreamCard } from '../lib/workstreamCard.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM workstreams WHERE archived = 0 ORDER BY sort_order ASC').all();
  res.json(rows.map(summarizeWorkstreamCard));
});

router.get('/:id', (req, res) => {
  const ws = db.prepare('SELECT * FROM workstreams WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'not found' });
  res.json(summarizeWorkstreamCard(ws));
});

router.post('/', (req, res) => {
  const { name, description = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM workstreams').get().m;
  const row = { id: id(), name: name.trim(), description, sort_order: maxOrder + 1, created_at: now() };
  db.prepare(
    'INSERT INTO workstreams (id, name, description, sort_order, created_at) VALUES (@id, @name, @description, @sort_order, @created_at)'
  ).run(row);
  res.status(201).json(summarizeWorkstreamCard(row));
});

router.patch('/:id', (req, res) => {
  const ws = db.prepare('SELECT * FROM workstreams WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'not found' });
  const { name, description, archived, sort_order, key_question, key_question_status } = req.body;
  db.prepare(
    'UPDATE workstreams SET name = ?, description = ?, archived = ?, sort_order = ?, key_question = ?, key_question_status = ? WHERE id = ?'
  ).run(
    name !== undefined ? name : ws.name,
    description !== undefined ? description : ws.description,
    archived !== undefined ? (archived ? 1 : 0) : ws.archived,
    sort_order !== undefined ? sort_order : ws.sort_order,
    key_question !== undefined ? key_question : ws.key_question,
    key_question_status !== undefined ? key_question_status : ws.key_question_status,
    ws.id
  );
  res.json(summarizeWorkstreamCard(db.prepare('SELECT * FROM workstreams WHERE id = ?').get(ws.id)));
});

// Full detail feed for the workstream page: everything tagged to it.
router.get('/:id/feed', (req, res) => {
  const wsId = req.params.id;
  const tasks = db.prepare('SELECT * FROM tasks WHERE workstream_id = ? ORDER BY done ASC, created_at DESC').all(wsId);
  const feedback = db.prepare('SELECT * FROM feedback WHERE workstream_id = ? ORDER BY created_at DESC').all(wsId);
  const insights = db.prepare('SELECT * FROM insights WHERE workstream_id = ? ORDER BY created_at DESC').all(wsId);
  const meetings = db.prepare('SELECT * FROM meetings WHERE workstream_id = ? ORDER BY date DESC, created_at DESC').all(wsId);
  const entries = db.prepare('SELECT * FROM day_entries WHERE workstream_id = ? ORDER BY created_at DESC').all(wsId);
  const photos = db.prepare('SELECT * FROM photos WHERE workstream_id = ? ORDER BY created_at DESC').all(wsId);
  res.json({ tasks, feedback, insights, meetings, entries, photos });
});

export default router;
