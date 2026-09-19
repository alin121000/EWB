const KEY = 'ewb_author_name';

export function getAuthorName() {
  return localStorage.getItem(KEY) || '';
}

export function setAuthorName(name) {
  localStorage.setItem(KEY, name.trim());
}
