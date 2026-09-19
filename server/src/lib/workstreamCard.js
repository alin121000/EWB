import { db } from '../db.js';

export function summarizeWorkstreamCard(ws) {
  const openTasks = db.prepare('SELECT COUNT(*) c FROM tasks WHERE workstream_id = ? AND done = 0').get(ws.id).c;

  const latest = db
    .prepare(
      `SELECT text, created_at FROM (
        SELECT observation AS text, created_at FROM feedback WHERE workstream_id = ?
        UNION ALL SELECT title AS text, created_at FROM insights WHERE workstream_id = ?
        UNION ALL SELECT (person_org || ': ' || notes) AS text, created_at FROM meetings WHERE workstream_id = ?
        UNION ALL SELECT title AS text, created_at FROM tasks WHERE workstream_id = ?
        UNION ALL SELECT text, created_at FROM day_entries WHERE workstream_id = ?
      ) ORDER BY created_at DESC LIMIT 1`
    )
    .get(ws.id, ws.id, ws.id, ws.id, ws.id);

  const unresolved = db
    .prepare(
      `SELECT text, created_at FROM (
        SELECT title AS text, created_at, due_date FROM tasks WHERE workstream_id = ? AND done = 0
        UNION ALL SELECT observation AS text, created_at, NULL AS due_date FROM feedback WHERE workstream_id = ? AND requires_followup = 1 AND task_id IS NULL
      ) ORDER BY due_date IS NULL, due_date ASC, created_at ASC LIMIT 1`
    )
    .get(ws.id, ws.id);

  return {
    ...ws,
    openTaskCount: openTasks,
    latestUpdate: latest ? latest.text : null,
    unresolvedItem: unresolved ? unresolved.text : null,
  };
}
