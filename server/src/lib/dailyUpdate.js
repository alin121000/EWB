import { callClaude } from './ai.js';

const SECTION_LABELS = {
  meeting: 'Meetings / Activities',
  finding: 'Findings',
  decision: 'Decisions',
  problem: 'Problems / Open Questions',
  followup: 'Follow-ups / Next Steps',
};

function grouped(entries) {
  const g = { note: [], meeting: [], finding: [], decision: [], problem: [], followup: [] };
  for (const e of entries) {
    if (g[e.section]) g[e.section].push(e);
  }
  return g;
}

export function buildTemplateUpdate(day, entries, tomorrow) {
  const g = grouped(entries);
  const lines = [];
  lines.push(`*Day ${day.day_number} Update – ${day.date}*`);
  if (day.locations) lines.push(`📍 ${day.locations}`);
  lines.push('');

  if (g.note.length) {
    lines.push('*What we did today*');
    for (const n of g.note.slice(0, 8)) lines.push(`• ${n.text}`);
    lines.push('');
  } else if (day.focus) {
    lines.push('*What we did today*');
    lines.push(`• ${day.focus}`);
    lines.push('');
  }

  for (const section of ['meeting', 'finding', 'decision', 'problem', 'followup']) {
    const items = g[section];
    if (!items.length) continue;
    lines.push(`*${SECTION_LABELS[section]}*`);
    for (const it of items) lines.push(`• ${it.text}`);
    lines.push('');
  }

  if (tomorrow?.focus) {
    lines.push('*Tomorrow*');
    lines.push(`• ${tomorrow.focus}`);
    lines.push('');
  }

  if (lines.length <= 3) {
    lines.push('_No notes captured yet for today._');
  }

  return lines.join('\n').trim();
}

export async function generateDailyUpdate(day, entries, tomorrow) {
  const g = grouped(entries);
  const raw = [
    `Day ${day.day_number} - ${day.date}`,
    day.locations ? `Locations: ${day.locations}` : '',
    day.orgs_people ? `Organizations/people met: ${day.orgs_people}` : '',
    day.focus ? `Focus: ${day.focus}` : '',
    '',
    'Notes:',
    ...g.note.map((n) => `- ${n.text}`),
    '',
    'Meetings/Activities:',
    ...g.meeting.map((n) => `- ${n.text}`),
    '',
    'Findings:',
    ...g.finding.map((n) => `- ${n.text}`),
    '',
    'Decisions:',
    ...g.decision.map((n) => `- ${n.text}`),
    '',
    'Problems/Questions:',
    ...g.problem.map((n) => `- ${n.text}`),
    '',
    'Follow-ups:',
    ...g.followup.map((n) => `- ${n.text}`),
    '',
    tomorrow?.focus ? `Tomorrow's plan: ${tomorrow.focus}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `You are helping an Engineers Without Borders Israel delegation to Ghana send a short daily update to colleagues back in Israel who are not on the trip.

Turn the raw field notes below into a concise, practical, professional update suitable for WhatsApp or email. Use short sections with these headers only where there is content: What we did today, Main developments, Important findings, Decisions, Problems / open questions, Follow-ups / next steps, and a short "Tomorrow" preview if a plan is given. Use bullet points, keep it tight, no fluff, no invented information - only use what is in the notes.

RAW NOTES:
${raw}`;

  const aiText = await callClaude(prompt);
  if (aiText) return { text: aiText, source: 'ai', raw };
  return { text: buildTemplateUpdate(day, entries, tomorrow), source: 'template', raw };
}
