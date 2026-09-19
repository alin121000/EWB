import { Router } from 'express';
import { db, id, now } from '../db.js';
import { getAuthor } from '../lib/util.js';

const router = Router();

router.get('/', (req, res) => {
  const { workstream, owner, status, after_delegation, q } = req.query;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (workstream) {
    sql += ' AND workstream_id = ?';
    params.push(workstream);
  }
  if (owner) {
    sql += ' AND owner = ?';
    params.push(owner);
  }
  if (status === 'open') {
    sql += ' AND done = 0';
  } else if (status === 'done') {
    sql += ' AND done = 1';
  }
  if (after_delegation === '1') {
    sql += ' AND after_delegation = 1';
  }
  if (q) {
    sql += ' AND (title LIKE ? OR note LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY done ASC, sort_order ASC, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const {
    title,
    workstream_id = null,
    owner = '',
    due_date = '',
    note = '',
    after_delegation = false,
    source_type = 'manual',
    source_id = null,
  } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'title required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM tasks').get().m;
  const row = {
    id: id(),
    title: title.trim(),
    workstream_id,
    owner,
    due_date,
    note,
    done: 0,
    after_delegation: after_delegation ? 1 : 0,
    sort_order: maxOrder + 1,
    source_type,
    source_id,
    author: getAuthor(req),
    created_at: now(),
    updated_at: now(),
    completed_at: null,
  };
  db.prepare(
    `INSERT INTO tasks (id, title, workstream_id, owner, due_date, note, done, after_delegation, sort_order, source_type, source_id, author, created_at, updated_at, completed_at)
     VALUES (@id, @title, @workstream_id, @owner, @due_date, @note, @done, @after_delegation, @sort_order, @source_type, @source_id, @author, @created_at, @updated_at, @completed_at)`
  ).run(row);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'not found' });
  const { title, workstream_id, owner, due_date, note, done, after_delegation, sort_order } = req.body;
  const next = {
    title: title !== undefined ? title : task.title,
    workstream_id: workstream_id !== undefined ? workstream_id : task.workstream_id,
    owner: owner !== undefined ? owner : task.owner,
    due_date: due_date !== undefined ? due_date : task.due_date,
    note: note !== undefined ? note : task.note,
    done: done !== undefined ? (done ? 1 : 0) : task.done,
    after_delegation: after_delegation !== undefined ? (after_delegation ? 1 : 0) : task.after_delegation,
    sort_order: sort_order !== undefined ? sort_order : task.sort_order,
    completed_at: done !== undefined ? (done ? now() : null) : task.completed_at,
    updated_at: now(),
  };
  db.prepare(
    `UPDATE tasks SET title=@title, workstream_id=@workstream_id, owner=@owner, due_date=@due_date, note=@note,
     done=@done, after_delegation=@after_delegation, sort_order=@sort_order, completed_at=@completed_at, updated_at=@updated_at
     WHERE id = @id`
  ).run({ ...next, id: task.id });
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

router.post('/reorder', (req, res) => {
  const { order } = req.body; // array of task ids in desired order
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
  const update = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids) => {
    ids.forEach((taskId, i) => update.run(i, taskId));
  });
  tx(order);
  res.json({ ok: true });
});

export default router;
