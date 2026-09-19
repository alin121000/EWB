export function getAuthor(req) {
  const name = (req.header('x-author-name') || '').trim();
  return name || 'Team member';
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function boolInt(v) {
  return v ? 1 : 0;
}
