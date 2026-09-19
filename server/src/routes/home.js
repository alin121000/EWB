import { Router } from 'express';
import { db, id, now } from '../db.js';
import { todayISO } from '../lib/util.js';
import { summarizeWorkstreamCard } from '../lib/workstreamCard.js';

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
  const today = ensureToday();

  const openTasks = db
    .prepare(
      `SELECT * FROM tasks WHERE done = 0 ORDER BY
       CASE WHEN due_date = '' OR due_date IS NULL THEN 1 ELSE 0 END,
       due_date ASC, created_at DESC LIMIT 8`
    )
    .all();

  const latestUpdates = db
    .prepare(
      `SELECT * FROM (
        SELECT id, 'note' AS type, text AS summary, author, created_at, workstream_id FROM day_entries
        UNION ALL SELECT id, 'feedback' AS type, observation AS summary, author, created_at, workstream_id FROM feedback
        UNION ALL SELECT id, 'insight' AS type, title AS summary, author, created_at, workstream_id FROM insights
        UNION ALL SELECT id, 'meeting' AS type, (person_org || ' — ' || notes) AS summary, author, created_at, workstream_id FROM meetings
      ) ORDER BY created_at DESC LIMIT 8`
    )
    .all();

  const workstreams = db.prepare('SELECT * FROM workstreams WHERE archived = 0 ORDER BY sort_order ASC').all();
  const workstreamCards = workstreams.map(summarizeWorkstreamCard);

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

  res.json({
    today,
    settings,
    openTasks,
    latestUpdates,
    workstreamCards,
  });
});

export default router;
