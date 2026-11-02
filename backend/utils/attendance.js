// Pure helpers for the daily attendance register (easy to unit test, no database needed).
const COUNTS_AS_PRESENT = ['Present', 'OnDuty'];

function isPresent(status) {
  return COUNTS_AS_PRESENT.includes(status);
}

// percentage with one decimal, e.g. 17 present of 20 days -> 85
function attendancePercent(presentDays, totalDays) {
  if (!totalDays) return null;
  return Math.round((presentDays / totalDays) * 1000) / 10;
}

// records: [{ status }]  ->  { total, present, absent, percent }
function summarize(records) {
  const total = records.length;
  const present = records.filter((r) => isPresent(r.status)).length;
  return { total, present, absent: total - present, percent: attendancePercent(present, total) };
}

// Accepts only real calendar dates written as YYYY-MM-DD
function isValidDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Latest date we accept: today + 1 day (covers every time zone)
function latestAllowedDate(now = new Date()) {
  return new Date(now.getTime() + 36 * 3600 * 1000).toISOString().slice(0, 10);
}

module.exports = { COUNTS_AS_PRESENT, isPresent, attendancePercent, summarize, isValidDateString, latestAllowedDate };
