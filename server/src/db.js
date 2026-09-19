import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR lets a host with a single mountable persistent volume (Render,
// Railway, Fly, etc.) keep the database across deploys/restarts.
const dataDir = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'db') : path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'ewb.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS workstreams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  key_question TEXT DEFAULT '',
  key_question_status TEXT DEFAULT 'unknown', -- unknown | yes | no
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS days (
  id TEXT PRIMARY KEY,
  day_number INTEGER NOT NULL,
  date TEXT NOT NULL UNIQUE,
  locations TEXT DEFAULT '',
  orgs_people TEXT DEFAULT '',
  focus TEXT DEFAULT '',
  closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS day_entries (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- note | meeting | finding | decision | problem | followup
  text TEXT NOT NULL,
  workstream_id TEXT REFERENCES workstreams(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  task_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_updates (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL UNIQUE REFERENCES days(id) ON DELETE CASCADE,
  raw_snapshot TEXT,
  generated_text TEXT,
  edited_text TEXT,
  source TEXT DEFAULT 'template',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  workstream_id TEXT REFERENCES workstreams(id) ON DELETE SET NULL,
  owner TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  note TEXT DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0,
  after_delegation INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_type TEXT DEFAULT 'manual',
  source_id TEXT,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  workstream_id TEXT REFERENCES workstreams(id) ON DELETE SET NULL,
  day_id TEXT REFERENCES days(id) ON DELETE SET NULL,
  source_text TEXT DEFAULT '',
  observation TEXT NOT NULL,
  works_well TEXT DEFAULT '',
  not_working TEXT DEFAULT '',
  suggested_change TEXT DEFAULT '',
  requires_followup INTEGER NOT NULL DEFAULT 0,
  task_id TEXT,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  workstream_id TEXT REFERENCES workstreams(id) ON DELETE SET NULL,
  tag TEXT DEFAULT 'Insight',
  author TEXT NOT NULL,
  created_at TEXT NOT NULL,
  converted_task_id TEXT
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  person_org TEXT NOT NULL,
  role TEXT DEFAULT '',
  date TEXT NOT NULL,
  day_id TEXT REFERENCES days(id) ON DELETE SET NULL,
  workstream_id TEXT REFERENCES workstreams(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  agreed TEXT DEFAULT '',
  followup TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  workstream_id TEXT REFERENCES workstreams(id) ON DELETE SET NULL,
  day_id TEXT REFERENCES days(id) ON DELETE SET NULL,
  feedback_id TEXT,
  meeting_id TEXT,
  insight_id TEXT,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  delegation_name TEXT DEFAULT 'EWB Israel – Ghana Delegation',
  start_date TEXT,
  exec_summary TEXT DEFAULT '',
  exec_summary_edited INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);
`);

const defaultWorkstreams = [
  ['Wheelchairs / ALYN', 'Physical feedback on existing chairs/products, condition in the field, adaptations and local improvements.', ''],
  ['Afeka / Documentation & Media', 'Photos, documentation, stories and materials needed for communication.', ''],
  ['University / Innovation Hub', 'University relationship, meetings, space and requirements for an innovation hub.', 'Is suitable space available at the university for an innovation hub?'],
  ['Students / Local Collaboration', 'Local student representatives, collaboration opportunities and knowledge transfer.', ''],
  ['General Delegation', 'Anything that does not belong to another workstream.', ''],
];

const wsCount = db.prepare('SELECT COUNT(*) AS c FROM workstreams').get().c;
if (wsCount === 0) {
  const insert = db.prepare(
    'INSERT INTO workstreams (id, name, description, sort_order, key_question, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const now = new Date().toISOString();
  defaultWorkstreams.forEach(([name, description, keyQuestion], i) => {
    insert.run(nanoid(10), name, description, i, keyQuestion, now);
  });
}

const settingsRow = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!settingsRow) {
  db.prepare(
    'INSERT INTO settings (id, delegation_name, start_date, updated_at) VALUES (1, ?, ?, ?)'
  ).run('EWB Israel – Ghana Delegation', new Date().toISOString().slice(0, 10), new Date().toISOString());
}

export const id = () => nanoid(10);
export const now = () => new Date().toISOString();
