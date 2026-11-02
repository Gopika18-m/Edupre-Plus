const test = require('node:test');
const assert = require('node:assert');
const { attendancePercent, summarize, isValidDateString, latestAllowedDate, isPresent } = require('../utils/attendance');
const { canDecide, canProgress } = require('../utils/workflow');
const { canAccessStudent, mentorFilter, isStaff } = require('../utils/access');

test('attendance percentage is present days / recorded days', () => {
  assert.strictEqual(attendancePercent(17, 20), 85);
  assert.strictEqual(attendancePercent(0, 10), 0);
  assert.strictEqual(attendancePercent(1, 3), 33.3);
  assert.strictEqual(attendancePercent(0, 0), null);
});

test('On Duty counts as present, Absent does not', () => {
  assert.ok(isPresent('Present'));
  assert.ok(isPresent('OnDuty'));
  assert.ok(!isPresent('Absent'));
  const s = summarize([{ status: 'Present' }, { status: 'OnDuty' }, { status: 'Absent' }, { status: 'Present' }]);
  assert.deepStrictEqual(s, { total: 4, present: 3, absent: 1, percent: 75 });
});

test('date validation accepts only real YYYY-MM-DD dates', () => {
  assert.ok(isValidDateString('2026-10-19'));
  assert.ok(!isValidDateString('2026-02-30'));
  assert.ok(!isValidDateString('19-10-2026'));
  assert.ok(!isValidDateString(''));
  assert.ok(!isValidDateString(undefined));
});

test('future dates are rejected beyond tomorrow', () => {
  const now = new Date('2026-10-19T10:00:00Z');
  assert.ok('2026-10-19' <= latestAllowedDate(now));
  assert.ok('2026-10-20' <= latestAllowedDate(now));
  assert.ok('2026-10-25' > latestAllowedDate(now));
});

test('intervention workflow: only Proposed can be decided', () => {
  assert.ok(canDecide('Proposed'));
  for (const s of ['Approved', 'Rejected', 'In Progress', 'Resolved']) assert.ok(!canDecide(s));
});

test('intervention workflow: progress must follow approval', () => {
  assert.ok(canProgress('Approved', 'In Progress'));
  assert.ok(canProgress('In Progress', 'Resolved'));
  assert.ok(canProgress('Approved', 'Resolved'));
  assert.ok(!canProgress('Proposed', 'In Progress'));
  assert.ok(!canProgress('Proposed', 'Resolved'));
  assert.ok(!canProgress('Rejected', 'In Progress'));
  assert.ok(!canProgress('Resolved', 'In Progress'));
});

test('mentors only access their own students', () => {
  const mentor = { _id: 'm1', role: 'mentor' };
  assert.ok(canAccessStudent(mentor, { mentor: 'm1' }));
  assert.ok(canAccessStudent(mentor, { mentor: { _id: 'm1' } }));
  assert.ok(!canAccessStudent(mentor, { mentor: 'm2' }));
  assert.ok(!canAccessStudent(mentor, {}));
  assert.ok(canAccessStudent({ role: 'faculty' }, { mentor: 'm2' }));
  assert.ok(!canAccessStudent({ role: 'student' }, { mentor: 'm1' }));
  assert.deepStrictEqual(mentorFilter(mentor), { mentor: 'm1' });
  assert.deepStrictEqual(mentorFilter({ role: 'admin' }), {});
  assert.ok(isStaff('admin') && isStaff('faculty') && !isStaff('mentor'));
});
