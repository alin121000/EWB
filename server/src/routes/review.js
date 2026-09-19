import { Router } from 'express';
import { db, now } from '../db.js';
import { todayISO } from '../lib/util.js';
import { buildFollowupPlan, generateExecSummary, buildWorkstreamSummary } from '../lib/review.js';

const router = Router();

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const days = db.prepare('SELECT * FROM days ORDER BY day_number ASC').all();
  const workstreams = db.prepare('SELECT * FROM workstreams WHERE archived = 0 ORDER BY sort_order ASC').all();
  const workstreamSummaries = workstreams.map(buildWorkstreamSummary);

  const openTasks = db.prepare('SELECT * FROM tasks WHERE done = 0 ORDER BY created_at ASC').all();
  const followupPlan = buildFollowupPlan(openTasks, todayISO());

  const openInsights = db
    .prepare("SELECT * FROM insights WHERE converted_task_id IS NULL AND tag IN ('Opportunity', 'Follow-up', 'Partnership') ORDER BY created_at ASC")
    .all();

  res.json({
    settings,
    days,
    workstreamSummaries,
    followupPlan,
    openInsights,
  });
});

router.post('/exec-summary/generate', async (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const days = db.prepare('SELECT * FROM days ORDER BY day_number ASC').all();
  const workstreams = db.prepare('SELECT * FROM workstreams WHERE archived = 0 ORDER BY sort_order ASC').all();
  const workstreamSummaries = workstreams.map(buildWorkstreamSummary).map((w) => ({
    name: w.name,
    hasContent: w.hasContent,
    headline: w.headline,
    findings: w.findings.map((f) => f.text),
    decisions: w.decisions.map((f) => f.text),
    problems: w.problems.map((f) => f.text),
    openTaskCount: w.openTasks.length,
  }));
  const openTasks = db.prepare('SELECT * FROM tasks WHERE done = 0').all();
  const followupPlan = buildFollowupPlan(openTasks, todayISO());

  const { text, source } = await generateExecSummary({
    delegationName: settings.delegation_name,
    days,
    workstreamSummaries,
    followupPlan: {
      immediate: followupPlan.immediate.map((t) => t.title),
      short: followupPlan.short.map((t) => t.title),
      long: followupPlan.long.map((t) => t.title),
    },
  });

  db.prepare('UPDATE settings SET exec_summary = ?, exec_summary_edited = 0, updated_at = ? WHERE id = 1').run(text, now());
  res.json({ exec_summary: text, source });
});

router.patch('/exec-summary', (req, res) => {
  const { exec_summary } = req.body;
  db.prepare('UPDATE settings SET exec_summary = ?, exec_summary_edited = 1, updated_at = ? WHERE id = 1').run(
    exec_summary || '',
    now()
  );
  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

router.patch('/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const { delegation_name, start_date } = req.body;
  db.prepare('UPDATE settings SET delegation_name = ?, start_date = ?, updated_at = ? WHERE id = 1').run(
    delegation_name !== undefined ? delegation_name : settings.delegation_name,
    start_date !== undefined ? start_date : settings.start_date,
    now()
  );
  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

export default router;
