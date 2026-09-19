import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ notes: [], feedback: [], tasks: [], meetings: [], insights: [] });
  const like = `%${q}%`;

  const notes = db
    .prepare('SELECT id, day_id, section, text, created_at FROM day_entries WHERE text LIKE ? ORDER BY created_at DESC LIMIT 25')
    .all(like);
  const feedback = db
    .prepare('SELECT id, observation, workstream_id, created_at FROM feedback WHERE observation LIKE ? OR suggested_change LIKE ? ORDER BY created_at DESC LIMIT 25')
    .all(like, like);
  const tasks = db
    .prepare('SELECT id, title, done, workstream_id, created_at FROM tasks WHERE title LIKE ? OR note LIKE ? ORDER BY created_at DESC LIMIT 25')
    .all(like, like);
  const meetings = db
    .prepare('SELECT id, person_org, notes, created_at FROM meetings WHERE person_org LIKE ? OR notes LIKE ? ORDER BY created_at DESC LIMIT 25')
    .all(like, like);
  const insights = db
    .prepare('SELECT id, title, description, created_at FROM insights WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 25')
    .all(like, like);

  res.json({ notes, feedback, tasks, meetings, insights });
});

export default router;
