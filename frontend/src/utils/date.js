const pad = (n) => String(n).padStart(2, '0');

// today as YYYY-MM-DD in the browser's own time zone
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtDate(s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(s).toLocaleDateString('en-IN', opts);
}
