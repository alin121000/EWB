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

function taskTitleFromFeedback(f) {
  const base = f.suggested_change || f.not_working || f.observation;
  return base.length > 90 ? base.slice(0, 87) + '...' : base;
}

router.get('/', (req, res) => {
  const { workstream, requires_followup, q } = req.query;
  let sql = 'SELECT * FROM feedback WHERE 1=1';
  const params = [];
  if (workstream) {
    sql += ' AND workstream_id = ?';
    params.push(workstream);
  }
  if (requires_followup === '1') {
    sql += ' AND requires_followup = 1';
  }
  if (q) {
    sql += ' AND (observation LIKE ? OR source_text LIKE ? OR suggested_change LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const {
    workstream_id = null,
    source_text = '',
    observation,
    works_well = '',
    not_working = '',
    suggested_change = '',
    requires_followup = false,
    create_task = false,
    day_id = null,
  } = req.body;
  if (!observation || !observation.trim()) return res.status(400).json({ error: 'observation required' });

  const day = day_id ? db.prepare('SELECT * FROM days WHERE id = ?').get(day_id) : ensureToday();
  const author = getAuthor(req);

  const row = {
    id: id(),
    workstream_id,
    day_id: day ? day.id : null,
    source_text,
    observation: observation.trim(),
    works_well,
    not_working,
    suggested_change,
    requires_followup: requires_followup ? 1 : 0,
    task_id: null,
    author,
    created_at: now(),
  };

  let task = null;
  if (requires_followup && create_task) {
    task = {
      id: id(),
      title: taskTitleFromFeedback(row),
      workstream_id,
      owner: '',
      due_date: '',
      note: `From field feedback: ${source_text || 'field observation'}`.trim(),
      done: 0,
      after_delegation: 0,
      sort_order: db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM tasks').get().m + 1,
      source_type: 'feedback',
      source_id: row.id,
      author,
      created_at: now(),
      updated_at: now(),
      completed_at: null,
    };
    row.task_id = task.id;
  }

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO feedback (id, workstream_id, day_id, source_text, observation, works_well, not_working, suggested_change, requires_followup, task_id, author, created_at)
       VALUES (@id, @workstream_id, @day_id, @source_text, @observation, @works_well, @not_working, @suggested_change, @requires_followup, @task_id, @author, @created_at)`
    ).run(row);
    if (task) {
      db.prepare(
        `INSERT INTO tasks (id, title, workstream_id, owner, due_date, note, done, after_delegation, sort_order, source_type, source_id, author, created_at, updated_at, completed_at)
         VALUES (@id, @title, @workstream_id, @owner, @due_date, @note, @done, @after_delegation, @sort_order, @source_type, @source_id, @author, @created_at, @updated_at, @completed_at)`
      ).run(task);
    }
  });
  tx();

  res.status(201).json({ ...row, task });
});

router.post('/:id/create-task', (req, res) => {
  const fb = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!fb) return res.status(404).json({ error: 'not found' });
  if (fb.task_id) return res.status(200).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(fb.task_id));
  const task = {
    id: id(),
    title: taskTitleFromFeedback(fb),
    workstream_id: fb.workstream_id,
    owner: '',
    due_date: '',
    note: `From field feedback: ${fb.source_text || 'field observation'}`.trim(),
    done: 0,
    after_delegation: 0,
    sort_order: db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM tasks').get().m + 1,
    source_type: 'feedback',
    source_id: fb.id,
    author: getAuthor(req),
    created_at: now(),
    updated_at: now(),
    completed_at: null,
  };
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO tasks (id, title, workstream_id, owner, due_date, note, done, after_delegation, sort_order, source_type, source_id, author, created_at, updated_at, completed_at)
       VALUES (@id, @title, @workstream_id, @owner, @due_date, @note, @done, @after_delegation, @sort_order, @source_type, @source_id, @author, @created_at, @updated_at, @completed_at)`
    ).run(task);
    db.prepare('UPDATE feedback SET task_id = ?, requires_followup = 1 WHERE id = ?').run(task.id, fb.id);
  });
  tx();
  res.status(201).json(task);
});

router.patch('/:id', (req, res) => {
  const fb = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!fb) return res.status(404).json({ error: 'not found' });
  const fields = ['workstream_id', 'source_text', 'observation', 'works_well', 'not_working', 'suggested_change', 'requires_followup'];
  const next = { ...fb };
  for (const f of fields) {
    if (req.body[f] !== undefined) next[f] = f === 'requires_followup' ? (req.body[f] ? 1 : 0) : req.body[f];
  }
  db.prepare(
    `UPDATE feedback SET workstream_id=@workstream_id, source_text=@source_text, observation=@observation, works_well=@works_well,
     not_working=@not_working, suggested_change=@suggested_change, requires_followup=@requires_followup WHERE id=@id`
  ).run(next);
  res.json(db.prepare('SELECT * FROM feedback WHERE id = ?').get(fb.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM feedback WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
