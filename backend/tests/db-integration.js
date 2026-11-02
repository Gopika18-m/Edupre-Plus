// Full end-to-end test against a REAL MongoDB.  It RESETS the database in MONGO_URI (runs the seed first),
// so point it at a throw-away database, never at data you want to keep:
//
//   MONGO_URI=mongodb://127.0.0.1:27017/edupre_plus_test npm run test:integration
//
require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration_secret';
const { execFileSync } = require('node:child_process');
const assert = require('node:assert');
const path = require('node:path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupre_plus_test';
if (/\/edupre_plus(\?|$)/.test(MONGO_URI) || /\/edupre(\?|$)/.test(MONGO_URI)) {
  console.error('Refusing to run: this test erases its database. Use a different name, e.g. .../edupre_plus_test');
  process.exit(1);
}
process.env.MONGO_URI = MONGO_URI;

let passed = 0;
const step = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

(async () => {
  console.log('Seeding test database...');
  execFileSync('node', [path.join(__dirname, '..', 'utils', 'seed.js')], { env: process.env, stdio: 'ignore' });
  await mongoose.connect(MONGO_URI);
  const app = require('../app');
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const api = async (method, url, token, body) => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, body: json };
  };
  const login = async (email, password) => { const r = await api('POST', '/auth/login', null, { email, password }); assert.strictEqual(r.status, 200, `login ${email}`); return r.body.token; };
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = ymd(new Date());
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };

  const T = {};
  await step('all four roles can log in; wrong password is rejected', async () => {
    T.faculty = await login('faculty@edupreplus.edu', 'faculty123');
    T.mentor = await login('mentor@edupreplus.edu', 'mentor123');
    T.mentor2 = await login('mentor2@edupreplus.edu', 'mentor123');
    T.admin = await login('admin@edupreplus.edu', 'admin123');
    T.student = await login('student@edupreplus.edu', 'student123');
    assert.strictEqual((await api('POST', '/auth/login', null, { email: 'faculty@edupreplus.edu', password: 'nope-nope' })).status, 401);
  });

  let all;
  await step('faculty sees all 12 students; mentor sees only own 6; student is blocked', async () => {
    all = (await api('GET', '/students?limit=100', T.faculty)).body;
    assert.strictEqual(all.total, 12);
    const mine = (await api('GET', '/students?limit=100', T.mentor)).body;
    assert.strictEqual(mine.total, 6);
    assert.ok(mine.students.every((s) => s.mentor.email === 'mentor@edupreplus.edu'));
    assert.strictEqual((await api('GET', '/students', T.student)).status, 403);
  });

  await step('mentor cannot open another mentor\'s student, but can open their own', async () => {
    const own = all.students.find((s) => s.mentor.email === 'mentor@edupreplus.edu');
    const other = all.students.find((s) => s.mentor.email === 'mentor2@edupreplus.edu');
    assert.strictEqual((await api('GET', `/students/${own._id}`, T.mentor)).status, 200);
    assert.strictEqual((await api('GET', `/students/${other._id}`, T.mentor)).status, 403);
    assert.strictEqual((await api('PUT', `/students/${own._id}`, T.mentor, { year: 3 })).status, 403); // mentors cannot edit records
  });

  await step('dashboard numbers are scoped by role', async () => {
    const f = (await api('GET', `/dashboard/summary?today=${today}`, T.faculty)).body;
    const m = (await api('GET', `/dashboard/summary?today=${today}`, T.mentor)).body;
    assert.strictEqual(f.totalStudents, 12);
    assert.strictEqual(m.totalStudents, 6);
    assert.strictEqual(f.pendingApprovals, 2);
    assert.ok(m.myProposals && m.myProposals.Proposed === 2);
    assert.strictEqual(f.attendanceToday.marked, 0);
  });

  let rosterIds;
  await step('daily attendance: roster, marking, automatic percentage recalculation', async () => {
    const roster = (await api('GET', `/attendance/roster?date=${today}`, T.mentor)).body;
    assert.strictEqual(roster.total, 6);
    assert.strictEqual(roster.markedCount, 0);
    rosterIds = roster.students.map((s) => s._id);
    const before = Object.fromEntries(roster.students.map((s) => [s._id, s.attendanceTotalDays]));
    const records = rosterIds.map((id, i) => ({ student: id, status: i === 0 ? 'Absent' : 'Present' }));
    const res = await api('POST', '/attendance/mark', T.mentor, { date: today, records });
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    assert.strictEqual(res.body.saved, 6);
    const after = (await api('GET', `/students/${rosterIds[0]}`, T.faculty)).body.student;
    assert.strictEqual(after.attendanceTotalDays, before[rosterIds[0]] + 1);
    const expected = Math.round((after.attendancePresentDays / after.attendanceTotalDays) * 1000) / 10;
    assert.strictEqual(after.attendance, expected);
    // history gets a new snapshot for the trend graph
    const hist = (await api('GET', `/students/${rosterIds[0]}`, T.faculty)).body.history;
    assert.ok(hist.some((h) => /Attendance updated/.test(h.note)));
  });

  await step('re-marking the same day updates the record instead of duplicating it', async () => {
    const records = rosterIds.map((id) => ({ student: id, status: 'Present' }));
    await api('POST', '/attendance/mark', T.mentor, { date: today, records });
    const s = (await api('GET', `/students/${rosterIds[0]}`, T.faculty)).body.student;
    const att = (await api('GET', `/attendance/student/${rosterIds[0]}?days=100`, T.faculty)).body;
    assert.strictEqual(att.records.filter((r) => r.date === today).length, 1);
    assert.strictEqual(att.records.find((r) => r.date === today).status, 'Present');
    assert.strictEqual(s.attendanceTotalDays, 41);
    const dash = (await api('GET', `/dashboard/summary?today=${today}`, T.mentor)).body;
    assert.strictEqual(dash.attendanceToday.marked, 6);
    assert.strictEqual(dash.attendanceToday.present, 6);
  });

  await step('attendance rules: mentor cannot mark others\' students; future and invalid dates rejected', async () => {
    const other = all.students.find((s) => s.mentor.email === 'mentor2@edupreplus.edu');
    assert.strictEqual((await api('POST', '/attendance/mark', T.mentor, { date: today, records: [{ student: other._id, status: 'Present' }] })).status, 403);
    assert.strictEqual((await api('POST', '/attendance/mark', T.faculty, { date: '2099-01-01', records: [{ student: other._id, status: 'Present' }] })).status, 400);
    assert.strictEqual((await api('POST', '/attendance/mark', T.faculty, { date: '2026-02-30', records: [{ student: other._id, status: 'Present' }] })).status, 400);
    assert.strictEqual((await api('POST', '/attendance/mark', T.student, { date: today, records: [] })).status, 403);
    assert.strictEqual((await api('POST', '/attendance/mark', T.faculty, { date: today, records: [{ student: other._id, status: 'Late' }] })).status, 400);
  });

  await step('typed attendance is ignored once daily attendance exists; other fields still update', async () => {
    const id = rosterIds[1];
    const before = (await api('GET', `/students/${id}`, T.faculty)).body.student;
    const res = await api('PUT', `/students/${id}`, T.faculty, { attendance: 12, assessmentMarks: 61 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.attendance, before.attendance);
    assert.strictEqual(res.body.assessmentMarks, 61);
  });

  let newStudent;
  await step('a student whose attendance collapses triggers Low-attendance and High-risk alerts', async () => {
    const mentorUser = (await api('GET', '/auth/me', T.mentor)).body.user;
    const mentors = (await api('GET', '/admin/mentors', T.faculty)).body;
    const m1 = mentors.find((m) => m.email === 'mentor@edupreplus.edu');
    const created = await api('POST', '/students', T.faculty, { name: 'Test Student', rollNumber: 'TEST001', email: 'teststudent@edupreplus.edu', year: 2, section: 'Z', mentor: m1._id,
      attendance: 100, assessmentMarks: 40, assignmentCompletion: 40, engagementScore: 40, previousPerformance: 40 });
    assert.strictEqual(created.status, 201, JSON.stringify(created.body));
    newStudent = created.body;
    assert.strictEqual(newStudent.riskLevel, 'Moderate');
    assert.strictEqual(newStudent.mentor.name, 'Mr. Arun Prasad');
    const mark = (date) => api('POST', '/attendance/mark', T.mentor, { date, records: [{ student: newStudent._id, status: 'Absent' }] });
    const r1 = await mark(daysAgo(2));
    assert.strictEqual(r1.body.alerts.lowAttendance, 1);
    assert.strictEqual(r1.body.alerts.highRisk, 1);
    const r2 = await mark(daysAgo(1));
    assert.strictEqual(r2.body.alerts.lowAttendance, 0); // already below 75, no repeat alert
    const s = (await api('GET', `/students/${newStudent._id}`, T.faculty)).body.student;
    assert.strictEqual(s.attendance, 0);
    assert.strictEqual(s.riskLevel, 'High');
    const notes = (await api('GET', '/notifications', T.mentor)).body.notifications;
    assert.ok(notes.some((n) => n.type === 'attendance' && /Test Student/.test(n.title)));
    assert.ok(notes.some((n) => n.type === 'risk' && /Test Student/.test(n.title)));
    const fnotes = (await api('GET', '/notifications', T.faculty)).body.notifications;
    assert.ok(fnotes.some((n) => n.type === 'risk' && /Test Student/.test(n.title)));
    assert.ok(mentorUser);
  });

  await step('student role: own progress includes attendance, notifications work, staff pages are blocked', async () => {
    const me = await api('GET', '/students/me', T.student);
    assert.strictEqual(me.status, 200);
    assert.strictEqual(me.body.student.name, 'Diya Sharma');
    assert.ok(me.body.attendance.records.length > 0);
    assert.strictEqual(me.body.attendance.total, 41);
    const n = (await api('GET', '/notifications', T.student)).body;
    assert.ok(n.notifications.some((x) => x.type === 'attendance' && x.link === '/my-progress'));
    assert.strictEqual((await api('GET', '/interventions', T.student)).status, 403);
    assert.strictEqual((await api('GET', '/dashboard/summary', T.student)).status, 403);
  });

  let proposal;
  await step('mentor proposes an intervention; faculty is notified; mentor cannot approve it', async () => {
    const res = await api('POST', '/interventions', T.mentor, { student: newStudent._id, recommendation: 'Weekly attendance counselling', category: 'Attendance' });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    proposal = res.body;
    assert.strictEqual(proposal.status, 'Proposed');
    assert.strictEqual(proposal.proposedBy.role, 'mentor');
    const fn = (await api('GET', '/notifications', T.faculty)).body.notifications;
    assert.ok(fn.some((n) => n.type === 'approval' && /Test Student/.test(n.message)));
    assert.strictEqual((await api('PUT', `/interventions/${proposal._id}/decision`, T.mentor, { decision: 'Approved' })).status, 403);
    // it cannot be progressed before approval
    assert.strictEqual((await api('PUT', `/interventions/${proposal._id}`, T.mentor, { status: 'Resolved' })).status, 400);
  });

  await step('mentor cannot propose for another mentor\'s student', async () => {
    const other = all.students.find((s) => s.mentor.email === 'mentor2@edupreplus.edu');
    assert.strictEqual((await api('POST', '/interventions', T.mentor, { student: other._id, recommendation: 'x' })).status, 403);
    assert.strictEqual((await api('POST', '/interventions', T.mentor, { student: 'not-an-id', recommendation: 'x' })).status, 400);
  });

  await step('faculty approves; mentor is notified; mentor moves it In Progress then Resolved; faculty is told', async () => {
    const bad = await api('PUT', `/interventions/${proposal._id}/decision`, T.faculty, { decision: 'Rejected' });
    assert.strictEqual(bad.status, 400); // a reason is required when rejecting
    const ok = await api('PUT', `/interventions/${proposal._id}/decision`, T.faculty, { decision: 'Approved', note: 'Go ahead' });
    assert.strictEqual(ok.status, 200);
    assert.strictEqual(ok.body.status, 'Approved');
    assert.strictEqual(ok.body.approvedBy.name, 'Faculty Coordinator');
    assert.strictEqual((await api('PUT', `/interventions/${proposal._id}/decision`, T.faculty, { decision: 'Rejected', note: 'late' })).status, 400); // already decided
    const mn = (await api('GET', '/notifications', T.mentor)).body.notifications;
    assert.ok(mn.some((n) => n.type === 'decision' && /approved/.test(n.title)));
    const p1 = await api('PUT', `/interventions/${proposal._id}`, T.mentor, { status: 'In Progress', progressNote: 'Started' });
    assert.strictEqual(p1.body.status, 'In Progress');
    const p2 = await api('PUT', `/interventions/${proposal._id}`, T.mentor, { status: 'Resolved', progressNote: 'Done' });
    assert.strictEqual(p2.body.status, 'Resolved');
    const fn = (await api('GET', '/notifications', T.faculty)).body.notifications;
    assert.ok(fn.some((n) => n.type === 'progress'));
  });

  await step('faculty can reject with a reason; faculty-created interventions are approved immediately', async () => {
    const p = (await api('POST', '/interventions', T.mentor, { student: newStudent._id, recommendation: 'Reduce workload', category: 'General' })).body;
    const rej = await api('PUT', `/interventions/${p._id}/decision`, T.faculty, { decision: 'Rejected', note: 'Not possible' });
    assert.strictEqual(rej.body.status, 'Rejected');
    assert.strictEqual((await api('PUT', `/interventions/${p._id}`, T.faculty, { status: 'In Progress' })).status, 400);
    const direct = await api('POST', '/interventions', T.faculty, { student: newStudent._id, recommendation: 'Parent meeting', category: 'Attendance' });
    assert.strictEqual(direct.body.status, 'Approved');
    const queue = (await api('GET', '/interventions?status=Proposed', T.faculty)).body;
    assert.ok(queue.length >= 2);
    const mineOnly = (await api('GET', '/interventions', T.mentor2)).body;
    assert.ok(mineOnly.every((i) => i.student.mentor && String(i.student.mentor) !== String(newStudent.mentor._id)));
  });

  await step('bulk upload assigns mentors by e-mail and reports bad rows', async () => {
    const res = await api('POST', '/students/bulk', T.faculty, { students: [
      { name: 'Bulk One', rollNumber: 'BULK1', year: '1', attendance: '90', mentorEmail: 'mentor2@edupreplus.edu' },
      { name: 'Bulk Two', rollNumber: 'BULK2', mentorEmail: 'nobody@x.com' },
      { name: 'Bulk Three', rollNumber: 'BULK1' },
    ] });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.createdCount, 1);
    assert.strictEqual(res.body.skippedCount, 2);
    assert.ok(res.body.skipped.some((s) => /Mentor/.test(s.reason)));
    const list = (await api('GET', '/students?search=Bulk One', T.mentor2)).body;
    assert.strictEqual(list.total, 1);
  });

  await step('admin: users, mentor assignment cleanup, reports, CSV export', async () => {
    const users = (await api('GET', '/admin/users', T.admin)).body;
    assert.ok(users.some((u) => u.role === 'mentor'));
    assert.strictEqual((await api('GET', '/admin/users', T.faculty)).status, 403);
    const tmp = (await api('POST', '/admin/users', T.admin, { name: 'Temp Mentor', email: 'temp@edupreplus.edu', password: 'secret1', role: 'mentor' })).body;
    assert.strictEqual(tmp.role, 'mentor');
    await api('PUT', `/students/${newStudent._id}`, T.faculty, { mentor: tmp.id });
    assert.strictEqual((await api('GET', `/students/${newStudent._id}`, T.faculty)).body.student.mentor.name, 'Temp Mentor');
    await api('DELETE', `/admin/users/${tmp.id}`, T.admin);
    assert.strictEqual((await api('GET', `/students/${newStudent._id}`, T.faculty)).body.student.mentor, undefined);
    const rep = (await api('GET', '/admin/reports', T.admin)).body;
    assert.ok(rep.byYear.length >= 3);
    assert.ok(rep.byMentor.some((m) => m.mentor === 'Mr. Arun Prasad'));
    assert.ok(rep.byMentor.some((m) => m.mentor === 'Unassigned'));
    const csv = await fetch(base + '/admin/reports/export', { headers: { Authorization: `Bearer ${T.admin}` } });
    const txt = await csv.text();
    assert.ok(txt.startsWith('Name,Roll Number'));
    assert.ok(txt.includes('Attendance %'));
    assert.ok(txt.includes('Diya Sharma'));
  });

  await step('notifications can be marked read', async () => {
    const before = (await api('GET', '/notifications', T.faculty)).body;
    assert.ok(before.unreadCount > 0);
    await api('PUT', `/notifications/${before.notifications[0]._id}/read`, T.faculty);
    const mid = (await api('GET', '/notifications', T.faculty)).body;
    assert.strictEqual(mid.unreadCount, before.unreadCount - 1);
    await api('PUT', '/notifications/read-all', T.faculty);
    assert.strictEqual((await api('GET', '/notifications', T.faculty)).body.unreadCount, 0);
  });

  server.close();
  await mongoose.disconnect();
  console.log(`\nAll ${passed} integration steps passed.`);
  process.exit(0);
})().catch((err) => {
  console.error('\nINTEGRATION TEST FAILED:\n', err);
  process.exit(1);
});
