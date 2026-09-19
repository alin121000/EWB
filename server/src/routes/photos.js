import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, id, now } from '../db.js';
import { getAuthor, todayISO } from '../lib/util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${id()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

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
  const { workstream, day } = req.query;
  let sql = 'SELECT * FROM photos WHERE 1=1';
  const params = [];
  if (workstream) {
    sql += ' AND workstream_id = ?';
    params.push(workstream);
  }
  if (day) {
    sql += ' AND day_id = ?';
    params.push(day);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'photo required' });
  const { caption = '', workstream_id = null, day_id = null, feedback_id = null, meeting_id = null, insight_id = null } = req.body;
  const day = day_id ? db.prepare('SELECT * FROM days WHERE id = ?').get(day_id) : ensureToday();
  const row = {
    id: id(),
    filename: req.file.filename,
    original_name: req.file.originalname,
    caption,
    workstream_id: workstream_id || null,
    day_id: day ? day.id : null,
    feedback_id: feedback_id || null,
    meeting_id: meeting_id || null,
    insight_id: insight_id || null,
    author: getAuthor(req),
    created_at: now(),
  };
  db.prepare(
    `INSERT INTO photos (id, filename, original_name, caption, workstream_id, day_id, feedback_id, meeting_id, insight_id, author, created_at)
     VALUES (@id, @filename, @original_name, @caption, @workstream_id, @day_id, @feedback_id, @meeting_id, @insight_id, @author, @created_at)`
  ).run(row);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'not found' });
  const { caption, workstream_id } = req.body;
  db.prepare('UPDATE photos SET caption = ?, workstream_id = ? WHERE id = ?').run(
    caption !== undefined ? caption : photo.caption,
    workstream_id !== undefined ? workstream_id : photo.workstream_id,
    photo.id
  );
  res.json(db.prepare('SELECT * FROM photos WHERE id = ?').get(photo.id));
});

router.delete('/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (photo) {
    const filePath = path.join(uploadsDir, photo.filename);
    fs.unlink(filePath, () => {});
    db.prepare('DELETE FROM photos WHERE id = ?').run(photo.id);
  }
  res.status(204).end();
});

export default router;
