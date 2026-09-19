import { getAuthorName } from '../identity.js';
import { setSyncState } from './syncStore.js';
import { dataUrlToBlob, blobToDataUrl, resizeImage } from './image.js';

const OUTBOX_KEY = 'ewb_outbox_v1';
const CACHE_PREFIX = 'ewb_cache_v1:';

function readOutbox() {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeOutbox(items) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  setSyncState({ pending: items.length });
}

function cacheGet(path) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + path);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheSet(path, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + path, JSON.stringify(data));
  } catch {
    // storage full or unavailable - safe to ignore, it's only a read cache
  }
}

function authHeaders() {
  const name = getAuthorName();
  return name ? { 'x-author-name': name } : {};
}

async function rawJsonRequest(method, path, json) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function rawFormRequest(path, blob, fields, fileFieldName, fileName) {
  const form = new FormData();
  form.append(fileFieldName, blob, fileName);
  Object.entries(fields).forEach(([k, v]) => v !== undefined && v !== null && form.append(k, v));
  const res = await fetch(path, { method: 'POST', headers: authHeaders(), body: form });
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function get(path) {
  try {
    const data = await rawJsonRequest('GET', path);
    cacheSet(path, data);
    setSyncState({ online: true });
    return data;
  } catch (e) {
    const cached = cacheGet(path);
    if (cached !== null) return cached;
    throw e;
  }
}

// Mutations queue themselves on failure so a dropped connection in the
// field never loses a note. Callers get {queued: true} back and should
// update local UI state optimistically.
export async function mutate(method, path, json) {
  try {
    const data = await rawJsonRequest(method, path, json);
    setSyncState({ online: true });
    flushOutbox();
    return { data, queued: false };
  } catch (e) {
    if (e.status) throw e; // real server error (validation etc) - don't queue
    enqueue({ kind: 'json', method, path, json, createdAt: Date.now() });
    setSyncState({ online: false });
    return { data: null, queued: true };
  }
}

export async function uploadPhoto(path, file, fields) {
  let blob;
  try {
    blob = await resizeImage(file);
  } catch {
    blob = file;
  }
  try {
    const data = await rawFormRequest(path, blob, fields, 'photo', file.name || 'photo.jpg');
    setSyncState({ online: true });
    flushOutbox();
    return { data, queued: false };
  } catch (e) {
    if (e.status) throw e;
    const dataUrl = await blobToDataUrl(blob);
    enqueue({
      kind: 'photo',
      method: 'POST',
      path,
      fields,
      dataUrl,
      fileName: file.name || 'photo.jpg',
      createdAt: Date.now(),
    });
    setSyncState({ online: false });
    return { data: null, queued: true };
  }
}

function enqueue(item) {
  const items = readOutbox();
  items.push({ id: `${item.createdAt}_${Math.random().toString(36).slice(2)}`, ...item });
  writeOutbox(items);
}

let flushing = false;
export async function flushOutbox() {
  if (flushing) return;
  const items = readOutbox();
  if (!items.length) return;
  flushing = true;
  setSyncState({ syncing: true });
  try {
    let remaining = [...items];
    for (const item of items) {
      try {
        if (item.kind === 'json') {
          await rawJsonRequest(item.method, item.path, item.json);
        } else if (item.kind === 'photo') {
          const blob = dataUrlToBlob(item.dataUrl);
          await rawFormRequest(item.path, blob, item.fields, 'photo', item.fileName);
        }
        remaining = remaining.filter((i) => i.id !== item.id);
        writeOutbox(remaining);
      } catch (e) {
        if (e.status) {
          // server rejected it outright - drop rather than block the queue forever
          remaining = remaining.filter((i) => i.id !== item.id);
          writeOutbox(remaining);
          continue;
        }
        break; // still offline - stop and retry later
      }
    }
    setSyncState({ online: navigator.onLine, pending: readOutbox().length });
  } finally {
    flushing = false;
    setSyncState({ syncing: false });
  }
}

setSyncState({ pending: readOutbox().length });
window.addEventListener('online', () => flushOutbox());
setInterval(() => {
  if (navigator.onLine) flushOutbox();
}, 20000);
