const LAST_WORKSTREAM_KEY = 'ewb_last_workstream';

export function getLastWorkstream() {
  return localStorage.getItem(LAST_WORKSTREAM_KEY) || '';
}

export function setLastWorkstream(id) {
  if (id) localStorage.setItem(LAST_WORKSTREAM_KEY, id);
}
