import { Router } from 'express';
import { db } from '../db.js';
import { todayISO } from '../lib/util.js';
import { buildFollowupPlan, buildWorkstreamSummary } from '../lib/review.js';

const router = Router();

const SECTION_LABEL = {
  exec_summary: 'Executive Summary',
  daily_summaries: 'Daily Summaries',
  feedback: 'Field Feedback',
  workstreams: 'Workstream Summaries',
  meetings: 'Meetings',
  insights: 'Insights & Opportunities',
  photos: 'Photos',
  completed_tasks: 'Completed Tasks',
  open_tasks: 'Open Tasks',
  followup_plan: 'Follow-up Plan',
};

const ALL_SECTIONS = Object.keys(SECTION_LABEL);

router.post('/', (req, res) => {
  const sections = Array.isArray(req.body.sections) && req.body.sections.length ? req.body.sections : ALL_SECTIONS;
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const days = db.prepare('SELECT * FROM days ORDER BY day_number ASC').all();
  const workstreams = db.prepare('SELECT * FROM workstreams WHERE archived = 0 ORDER BY sort_order ASC').all();

  const lines = [];
  lines.push(`# ${settings.delegation_name}`);
  lines.push(`_Delegation Review – generated ${todayISO()}_`);
  lines.push('');

  if (sections.includes('exec_summary') && settings.exec_summary) {
    lines.push('## Executive Summary');
    lines.push(settings.exec_summary);
    lines.push('');
  }

  if (sections.includes('daily_summaries')) {
    lines.push('## Daily Summaries');
    for (const day of days) {
      const update = db.prepare('SELECT * FROM daily_updates WHERE day_id = ?').get(day.id);
      lines.push(`### Day ${day.day_number} – ${day.date}`);
      if (day.locations) lines.push(`Locations: ${day.locations}`);
      if (update?.edited_text) {
        lines.push(update.edited_text);
      } else if (day.focus) {
        lines.push(day.focus);
      } else {
        lines.push('_No update generated for this day._');
      }
      lines.push('');
    }
  }

  if (sections.includes('workstreams')) {
    lines.push('## Workstream Summaries');
    for (const ws of workstreams) {
      const s = buildWorkstreamSummary(ws);
      lines.push(`### ${ws.name}`);
      if (!s.hasContent) {
        lines.push('_No activity logged._');
        lines.push('');
        continue;
      }
      if (s.whatWeDid.length) {
        lines.push('**What we did / learned:**');
        s.whatWeDid.forEach((n) => lines.push(`- ${n.text}`));
      }
      if (s.findings.length) {
        lines.push('**Findings:**');
        s.findings.forEach((n) => lines.push(`- ${n.text}`));
      }
      if (sections.includes('feedback') && s.feedback.length) {
        lines.push('**Field feedback:**');
        s.feedback.forEach((f) => lines.push(`- ${f.observation}${f.suggested_change ? ` → Suggested: ${f.suggested_change}` : ''}`));
      }
      if (s.problems.length) {
        lines.push('**Problems identified:**');
        s.problems.forEach((n) => lines.push(`- ${n.text}`));
      }
      if (s.decisions.length) {
        lines.push('**Decisions:**');
        s.decisions.forEach((n) => lines.push(`- ${n.text}`));
      }
      if (s.recommendations.length) {
        lines.push('**Recommendations:**');
        s.recommendations.forEach((n) => lines.push(`- ${n.title}`));
      }
      if (s.openTasks.length) {
        lines.push('**Open tasks / next steps:**');
        s.openTasks.forEach((t) => lines.push(`- ${t.title}${t.owner ? ` (${t.owner})` : ''}`));
      }
      lines.push('');
    }
  }

  if (sections.includes('meetings')) {
    const meetings = db.prepare('SELECT * FROM meetings ORDER BY date ASC').all();
    if (meetings.length) {
      lines.push('## Meetings');
      for (const m of meetings) {
        lines.push(`### ${m.person_org}${m.role ? ` (${m.role})` : ''} – ${m.date}`);
        if (m.notes) lines.push(m.notes);
        if (m.agreed) lines.push(`Agreed: ${m.agreed}`);
        if (m.followup) lines.push(`Follow-up: ${m.followup}`);
        lines.push('');
      }
    }
  }

  if (sections.includes('insights')) {
    const insights = db.prepare('SELECT * FROM insights ORDER BY created_at ASC').all();
    if (insights.length) {
      lines.push('## Insights & Opportunities');
      for (const i of insights) {
        lines.push(`- **[${i.tag}] ${i.title}**${i.description ? ` – ${i.description}` : ''}`);
      }
      lines.push('');
    }
  }

  if (sections.includes('open_tasks')) {
    const openTasks = db.prepare('SELECT * FROM tasks WHERE done = 0 ORDER BY created_at ASC').all();
    lines.push('## Open Tasks');
    if (openTasks.length) {
      openTasks.forEach((t) => lines.push(`- [ ] ${t.title}${t.owner ? ` (${t.owner})` : ''}${t.due_date ? ` – due ${t.due_date}` : ''}`));
    } else {
      lines.push('_No open tasks._');
    }
    lines.push('');
  }

  if (sections.includes('completed_tasks')) {
    const doneTasks = db.prepare('SELECT * FROM tasks WHERE done = 1 ORDER BY completed_at ASC').all();
    lines.push('## Completed Tasks');
    if (doneTasks.length) {
      doneTasks.forEach((t) => lines.push(`- [x] ${t.title}${t.owner ? ` (${t.owner})` : ''}`));
    } else {
      lines.push('_No completed tasks._');
    }
    lines.push('');
  }

  if (sections.includes('followup_plan')) {
    const openTasks = db.prepare('SELECT * FROM tasks WHERE done = 0 ORDER BY created_at ASC').all();
    const plan = buildFollowupPlan(openTasks, todayISO());
    lines.push('## Follow-up Plan');
    lines.push('### Immediate');
    plan.immediate.length ? plan.immediate.forEach((t) => lines.push(`- ${t.title}`)) : lines.push('_None._');
    lines.push('### Short Term');
    plan.short.length ? plan.short.forEach((t) => lines.push(`- ${t.title}`)) : lines.push('_None._');
    lines.push('### Longer Term');
    plan.long.length ? plan.long.forEach((t) => lines.push(`- ${t.title}`)) : lines.push('_None._');
    lines.push('');
  }

  if (sections.includes('photos')) {
    const photos = db.prepare('SELECT * FROM photos ORDER BY created_at ASC').all();
    lines.push('## Photos');
    lines.push(photos.length ? `${photos.length} photo(s) captured during the delegation (see gallery / attachments).` : '_No photos captured._');
    photos.forEach((p) => lines.push(`- ${p.filename}${p.caption ? ` – ${p.caption}` : ''}`));
    lines.push('');
  }

  res.json({ markdown: lines.join('\n').trim(), sections: ALL_SECTIONS.map((s) => ({ key: s, label: SECTION_LABEL[s] })) });
});

router.get('/sections', (req, res) => {
  res.json(ALL_SECTIONS.map((s) => ({ key: s, label: SECTION_LABEL[s] })));
});

export default router;
