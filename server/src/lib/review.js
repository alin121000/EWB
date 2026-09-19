import { callClaude } from './ai.js';
import { db } from '../db.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildWorkstreamSummary(ws) {
  const tasks = db.prepare('SELECT * FROM tasks WHERE workstream_id = ? ORDER BY done ASC, created_at ASC').all(ws.id);
  const feedback = db.prepare('SELECT * FROM feedback WHERE workstream_id = ? ORDER BY created_at ASC').all(ws.id);
  const insights = db.prepare('SELECT * FROM insights WHERE workstream_id = ? ORDER BY created_at ASC').all(ws.id);
  const meetings = db.prepare('SELECT * FROM meetings WHERE workstream_id = ? ORDER BY date ASC').all(ws.id);
  const entries = db.prepare('SELECT * FROM day_entries WHERE workstream_id = ? ORDER BY created_at ASC').all(ws.id);
  const photos = db.prepare('SELECT COUNT(*) c FROM photos WHERE workstream_id = ?').get(ws.id).c;

  const findings = entries.filter((e) => e.section === 'finding');
  const decisions = entries.filter((e) => e.section === 'decision');
  const problems = entries.filter((e) => e.section === 'problem');
  const notes = entries.filter((e) => e.section === 'note' || e.section === 'meeting');
  const recommendations = insights.filter((i) => i.tag === 'Recommendation');
  const openTasks = tasks.filter((t) => !t.done);

  const hasContent =
    tasks.length + feedback.length + insights.length + meetings.length + entries.length + photos > 0;

  const headlineParts = [];
  if (notes.length) headlineParts.push(`${notes.length} note(s)`);
  if (feedback.length) headlineParts.push(`${feedback.length} feedback item(s)`);
  if (meetings.length) headlineParts.push(`${meetings.length} meeting(s)`);
  if (openTasks.length) headlineParts.push(`${openTasks.length} open task(s)`);
  const headline = headlineParts.length ? headlineParts.join(', ') : 'No activity logged yet.';

  return {
    id: ws.id,
    name: ws.name,
    hasContent,
    headline,
    whatWeDid: notes,
    findings,
    feedback,
    problems,
    decisions,
    recommendations,
    meetings,
    openTasks,
    doneTasks: tasks.filter((t) => t.done),
    photoCount: photos,
  };
}

// Heuristic bucketing for the Follow-up Plan: there is no separate
// "urgency" field in the MVP data model, so we derive it from due_date
// and the after_delegation flag rather than asking users for one more
// input on every task.
export function bucketTask(task, todayISO) {
  const today = new Date(todayISO);
  if (task.due_date) {
    const due = new Date(task.due_date);
    const days = (due - today) / DAY_MS;
    if (days <= 14) return 'immediate';
    if (days <= 60) return 'short';
    return 'long';
  }
  return task.after_delegation ? 'short' : 'immediate';
}

export function buildFollowupPlan(openTasks, todayISO) {
  const plan = { immediate: [], short: [], long: [] };
  for (const t of openTasks) {
    plan[bucketTask(t, todayISO)].push(t);
  }
  return plan;
}

export function buildTemplateExecSummary({ delegationName, days, workstreamSummaries, followupPlan }) {
  const lines = [];
  lines.push(`${delegationName} – Delegation Summary`);
  lines.push(`${days.length} day(s) in the field.`);
  lines.push('');
  for (const ws of workstreamSummaries) {
    if (!ws.hasContent) continue;
    lines.push(`${ws.name}: ${ws.headline}`);
  }
  lines.push('');
  const total = followupPlan.immediate.length + followupPlan.short.length + followupPlan.long.length;
  lines.push(`${total} open follow-up item(s): ${followupPlan.immediate.length} immediate, ${followupPlan.short.length} short-term, ${followupPlan.long.length} longer-term.`);
  return lines.join('\n');
}

export async function generateExecSummary(data) {
  const prompt = `You are writing the executive summary for a delegation report for Engineers Without Borders Israel, covering a delegation to Ghana. Write 4-8 concise, professional sentences summarizing the trip: what was accomplished, the main workstreams and their status, the most important findings/decisions, and the overall state of follow-up work. Be factual and only use the data given - do not invent details.

DATA (JSON):
${JSON.stringify(data, null, 2)}`;

  const aiText = await callClaude(prompt, { maxTokens: 800 });
  if (aiText) return { text: aiText, source: 'ai' };
  return { text: buildTemplateExecSummary(data), source: 'template' };
}
