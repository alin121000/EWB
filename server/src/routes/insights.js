import { Router } from 'express';
import { db, id, now } from '../db.js';
import { getAuthor } from '../lib/util.js';

const router = Router();

router.get('/', (req, res) => {
  const { workstream, tag, q } = req.query;
  let sql = 'SELECT * FROM insights WHERE 1=1';
  const params = [];
  if (workstream) {
    sql += ' AND workstream_id = ?';
    params.push(workstream);
  }
  if (tag) {
    sql += ' AND tag = ?';
    params.push(tag);
  }
  if (q) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { title, description = '', workstream_id = null, tag = 'Insight' } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'title required' });
  const row = {
    id: id(),
    title: title.trim(),
    description,
    workstream_id,
    tag,
    author: getAuthor(req),
    created_at: now(),
    converted_task_id: null,
  };
  db.prepare(
    'INSERT INTO insights (id, title, description, workstream_id, tag, author, created_at, converted_task_id) VALUES (@id, @title, @description, @workstream_id, @tag, @author, @created_at, @converted_task_id)'
  ).run(row);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const ins = db.prepare('SELECT * FROM insights WHERE id = ?').get(req.params.id);
  if (!ins) return res.status(404).json({ error: 'not found' });
  const { title, description, workstream_id, tag } = req.body;
  db.prepare('UPDATE insights SET title=?, description=?, workstream_id=?, tag=? WHERE id=?').run(
    title !== undefined ? title : ins.title,
    description !== undefined ? description : ins.description,
    workstream_id !== undefined ? workstream_id : ins.workstream_id,
    tag !== undefined ? tag : ins.tag,
    ins.id
  );
  res.json(db.prepare('SELECT * FROM insights WHERE id = ?').get(ins.id));
});

router.post('/:id/convert-to-task', (req, res) => {
  const ins = db.prepare('SELECT * FROM insights WHERE id = ?').get(req.params.id);
  if (!ins) return res.status(404).json({ error: 'not found' });
  if (ins.converted_task_id) return res.status(200).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(ins.converted_task_id));
  const task = {
    id: id(),
    title: ins.title,
    workstream_id: ins.workstream_id,
    owner: '',
    due_date: '',
    note: ins.description,
    done: 0,
    after_delegation: 0,
    sort_order: db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM tasks').get().m + 1,
    source_type: 'insight',
    source_id: ins.id,
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
    db.prepare('UPDATE insights SET converted_task_id = ? WHERE id = ?').run(task.id, ins.id);
  });
  tx();
  res.status(201).json(task);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM insights WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
