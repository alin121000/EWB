import { get, mutate, uploadPhoto as apiUploadPhoto } from './api.js';

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!clean.length) return '';
  return '?' + new URLSearchParams(clean).toString();
};

export const Home = { get: () => get('/api/home') };

export const Workstreams = {
  list: () => get('/api/workstreams'),
  get: (id) => get(`/api/workstreams/${id}`),
  feed: (id) => get(`/api/workstreams/${id}/feed`),
  create: (body) => mutate('POST', '/api/workstreams', body),
  update: (id, body) => mutate('PATCH', `/api/workstreams/${id}`, body),
};

export const Days = {
  list: () => get('/api/days'),
  today: () => get('/api/days/today'),
  get: (id) => get(`/api/days/${id}`),
  create: (body) => mutate('POST', '/api/days', body),
  update: (id, body) => mutate('PATCH', `/api/days/${id}`, body),
  addEntry: (dayId, body) => mutate('POST', `/api/days/${dayId}/entries`, body),
  updateEntry: (entryId, body) => mutate('PATCH', `/api/days/entries/${entryId}`, body),
  deleteEntry: (entryId) => mutate('DELETE', `/api/days/entries/${entryId}`),
  review: (dayId) => get(`/api/days/${dayId}/review`),
  generateUpdate: (dayId) => mutate('POST', `/api/days/${dayId}/update/generate`),
  editUpdate: (dayId, edited_text) => mutate('PATCH', `/api/days/${dayId}/update`, { edited_text }),
};

export const Tasks = {
  list: (filters) => get(`/api/tasks${qs(filters)}`),
  create: (body) => mutate('POST', '/api/tasks', body),
  update: (id, body) => mutate('PATCH', `/api/tasks/${id}`, body),
  remove: (id) => mutate('DELETE', `/api/tasks/${id}`),
  reorder: (order) => mutate('POST', '/api/tasks/reorder', { order }),
};

export const Feedback = {
  list: (filters) => get(`/api/feedback${qs(filters)}`),
  create: (body) => mutate('POST', '/api/feedback', body),
  createTask: (id) => mutate('POST', `/api/feedback/${id}/create-task`),
  update: (id, body) => mutate('PATCH', `/api/feedback/${id}`, body),
  remove: (id) => mutate('DELETE', `/api/feedback/${id}`),
};

export const Insights = {
  list: (filters) => get(`/api/insights${qs(filters)}`),
  create: (body) => mutate('POST', '/api/insights', body),
  update: (id, body) => mutate('PATCH', `/api/insights/${id}`, body),
  convertToTask: (id) => mutate('POST', `/api/insights/${id}/convert-to-task`),
  remove: (id) => mutate('DELETE', `/api/insights/${id}`),
};

export const Meetings = {
  list: (filters) => get(`/api/meetings${qs(filters)}`),
  create: (body) => mutate('POST', '/api/meetings', body),
  update: (id, body) => mutate('PATCH', `/api/meetings/${id}`, body),
  remove: (id) => mutate('DELETE', `/api/meetings/${id}`),
};

export const Photos = {
  list: (filters) => get(`/api/photos${qs(filters)}`),
  upload: (file, fields) => apiUploadPhoto('/api/photos', file, fields),
  update: (id, body) => mutate('PATCH', `/api/photos/${id}`, body),
  remove: (id) => mutate('DELETE', `/api/photos/${id}`),
};

export const Review = {
  get: () => get('/api/review'),
  generateExecSummary: () => mutate('POST', '/api/review/exec-summary/generate'),
  editExecSummary: (exec_summary) => mutate('PATCH', '/api/review/exec-summary', { exec_summary }),
  updateSettings: (body) => mutate('PATCH', '/api/review/settings', body),
};

export const Exporter = {
  sections: () => get('/api/export/sections'),
  build: (sections) => mutate('POST', '/api/export', { sections }),
};

export const Search = {
  run: (q) => get(`/api/search?q=${encodeURIComponent(q)}`),
};
