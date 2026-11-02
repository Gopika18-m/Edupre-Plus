require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const AcademicRecord = require('../models/AcademicRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const Intervention = require('../models/Intervention');
const Notification = require('../models/Notification');
const { computeRisk } = require('./risk');
const { attendancePercent } = require('./attendance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupre_plus';
const DAYS = 40; // weekdays of history

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// last DAYS weekdays before today (oldest first)
function weekdays() {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < DAYS) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.unshift(new Date(d));
  }
  return out;
}

//        name              year sec mentor attend marks assign engage prev
const STUDENTS = [
  ['Aarav Kumar',    2, 'A', 0, 92, 88, 95, 85, 90],
  ['Diya Sharma',    2, 'A', 0, 65, 42, 50, 40, 55],
  ['Kabir Rao',      2, 'B', 1, 78, 60, 70, 65, 72],
  ['Meera Iyer',     3, 'A', 0, 52, 30, 40, 30, 45],
  ['Vihaan Nair',    1, 'C', 1, 88, 75, 80, 78, 80],
  ['Anika Reddy',    3, 'B', 1, 95, 92, 98, 90, 94],
  ['Reyansh Gupta',  2, 'C', 1, 70, 55, 60, 58, 62],
  ['Saanvi Joshi',   1, 'A', 0, 48, 35, 40, 30, 42],
  ['Arjun Pillai',   4, 'B', 1, 85, 80, 85, 75, 82],
  ['Ira Desai',      4, 'A', 0, 60, 48, 55, 45, 50],
  ['Rohan Mehta',    3, 'A', 0, 80, 70, 75, 72, 78],
  ['Tara Nambiar',   1, 'B', 1, 72, 58, 62, 55, 60],
];

async function seedData(reset = true) {
  if (mongoose.connection.name === 'edupre') {
    console.error('Refusing to seed the database "edupre": it belongs to the ORIGINAL EduPre project.');
    console.error('EduPre Plus uses its own database. Set MONGO_URI=mongodb://127.0.0.1:27017/edupre_plus in backend/.env');
    return;
  }
  console.log(`Connected to database "${mongoose.connection.name}". ${reset ? 'Resetting and seeding...' : 'Seeding initial data...'}`);

  if (reset) {
    await Promise.all([User, Student, AcademicRecord, AttendanceRecord, Intervention, Notification].map((m) => m.deleteMany({})));
  }

  const admin = await User.create({ name: 'Admin', email: 'admin@edupreplus.edu', password: 'admin123', role: 'admin' });
  const faculty = await User.create({ name: 'Faculty Coordinator', email: 'faculty@edupreplus.edu', password: 'faculty123', role: 'faculty' });
  const mentors = [
    await User.create({ name: 'Mr. Arun Prasad', email: 'mentor@edupreplus.edu', password: 'mentor123', role: 'mentor' }),
    await User.create({ name: 'Dr. Priya Menon', email: 'mentor2@edupreplus.edu', password: 'mentor123', role: 'mentor' }),
  ];
  await User.create({ name: 'Diya Sharma', email: 'student@edupreplus.edu', password: 'student123', role: 'student' });

  const dates = weekdays().map(fmt);
  const dateObjs = weekdays();
  const cps = [Math.floor(DAYS * 0.25), Math.floor(DAYS * 0.5), Math.floor(DAYS * 0.75)]; // trend checkpoints
  const created = [];

  for (let idx = 0; idx < STUDENTS.length; idx += 1) {
    const [name, year, section, m, target, marks, assign, engage, prev] = STUDENTS[idx];
    const email = name === 'Diya Sharma' ? 'student@edupreplus.edu' : `${name.split(' ')[0].toLowerCase()}@edupreplus.edu`;

    // deterministic "random" attendance that averages about the target
    const statuses = dates.map((_, i) => ((i * 37 + idx * 53 + 11) % 100 < target ? (i % 9 === 4 && target > 60 ? 'OnDuty' : 'Present') : 'Absent'));

    const present = statuses.filter((s) => s !== 'Absent').length;
    const student = await Student.create({
      name, email, year, section, mentor: mentors[m]._id, createdBy: faculty._id,
      attendance: attendancePercent(present, DAYS), attendanceTotalDays: DAYS, attendancePresentDays: present,
      assessmentMarks: marks, assignmentCompletion: assign, engagementScore: engage, previousPerformance: prev,
      rollNumber: `3106242050${pad(idx + 1)}`,
    });
    created.push(student);

    await AttendanceRecord.insertMany(dates.map((date, i) => ({ student: student._id, date, status: statuses[i], markedBy: mentors[m]._id })));

    // history snapshots (trend graph): attendance as it was at each checkpoint, then today's values
    const points = [...cps, DAYS - 1];
    for (let p = 0; p < points.length; p += 1) {
      const upto = statuses.slice(0, points[p] + 1);
      const pres = upto.filter((s) => s !== 'Absent').length;
      const att = p === points.length - 1 ? student.attendance : attendancePercent(pres, upto.length);
      const risk = computeRisk({ attendance: att, assessmentMarks: marks, assignmentCompletion: assign, engagementScore: engage, previousPerformance: prev });
      await AcademicRecord.create({
        student: student._id, attendance: att, assessmentMarks: marks, assignmentCompletion: assign, engagementScore: engage,
        riskScore: risk.riskScore, riskLevel: risk.riskLevel, note: p === 0 ? 'Initial record' : 'Attendance updated',
        recordedAt: dateObjs[points[p]],
      });
    }
  }

  const by = (n) => created.find((s) => s.name === n);
  const IV = (name, status, rec, cat, proposer, extra = {}) => Intervention.create({
    student: by(name)._id, recommendation: rec, category: cat, status, proposedBy: proposer._id, ...extra,
  });
  const decided = { approvedBy: faculty._id, decidedAt: new Date() };
  const i1 = await IV('Diya Sharma', 'Proposed', 'Weekly counselling sessions and a peer tutor for internal test preparation.', 'Academic Support', mentors[0]);
  const i2 = await IV('Saanvi Joshi', 'Proposed', 'Meet the parents and agree an attendance improvement plan.', 'Attendance', mentors[0]);
  await IV('Meera Iyer', 'In Progress', 'Enroll in remedial classes for the weak subjects.', 'Academic Support', mentors[0], { ...decided, decisionNote: 'Approved. Start this week.', progressNote: 'Attending two remedial classes per week.' });
  await IV('Ira Desai', 'Rejected', 'Reduce the project workload for one month.', 'General', mentors[0], { ...decided, decisionNote: 'Final year project deadlines cannot be moved. Try peer support instead.' });
  await IV('Reyansh Gupta', 'Resolved', 'Group study sessions with the class topper.', 'Engagement', mentors[1], { ...decided, decisionNote: 'Good idea.', progressNote: 'Completed. Engagement improved.' });
  await IV('Tara Nambiar', 'Approved', 'Mentor check-in every Friday on assignment progress.', 'Academic Support', mentors[1], { ...decided, decisionNote: 'Approved.' });

  // notifications
  const staff = [admin, faculty];
  const note = (user, o) => ({ user: user._id, ...o });
  const list = [];
  created.filter((s) => s.riskLevel === 'High').forEach((s) => {
    [...staff, mentors[STUDENTS.find((r) => r[0] === s.name)[3]]].forEach((u) => list.push(note(u, {
      student: s._id, type: 'risk', title: `${s.name} is now High Risk`, message: `Risk score ${s.riskScore}. ${s.riskFactors.join(', ')}.`, link: `/students/${s._id}` })));
  });
  created.filter((s) => s.attendance < 75).forEach((s) => {
    const mentor = mentors[STUDENTS.find((r) => r[0] === s.name)[3]];
    list.push(note(mentor, { student: s._id, type: 'attendance', title: `Low attendance: ${s.name}`, message: `Attendance is now ${s.attendance}% (below 75%).`, link: `/students/${s._id}` }));
  });
  const diyaLogin = await User.findOne({ email: 'student@edupreplus.edu' });
  list.push(note(diyaLogin, { student: by('Diya Sharma')._id, type: 'attendance', title: 'Your attendance is below 75%', message: `Attendance is now ${by('Diya Sharma').attendance}% (below 75%).`, link: '/my-progress' }));
  [i1, i2].forEach((iv, k) => staff.forEach((u) => list.push(note(u, {
    student: iv.student, type: 'approval', title: 'Intervention waiting for approval',
    message: `${mentors[0].name} proposed "${iv.recommendation}" for ${[by('Diya Sharma'), by('Saanvi Joshi')][k].name}.`, link: '/interventions?status=Proposed' }))));
  list.push(note(mentors[0], { student: by('Ira Desai')._id, type: 'decision', title: 'Intervention rejected', message: 'Faculty Coordinator rejected your proposal for Ira Desai. Note: Final year project deadlines cannot be moved. Try peer support instead.', link: '/interventions' }));
  await Notification.insertMany(list);

  const counts = { Low: 0, Moderate: 0, High: 0 };
  created.forEach((s) => { counts[s.riskLevel] += 1; });
  console.log(`Seed complete: ${created.length} students, ${created.length * DAYS} attendance records (${DAYS} weekdays), risk ${JSON.stringify(counts)}.`);
  console.log('Demo Credentials:');
  console.log('  Admin    : admin@edupreplus.edu    / admin123');
  console.log('  Faculty  : faculty@edupreplus.edu  / faculty123');
  console.log('  Mentor   : mentor@edupreplus.edu   / mentor123   (also mentor2@edupreplus.edu)');
  console.log('  Student  : student@edupreplus.edu  / student123');
}

async function autoSeed() {
  const User = require('../models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Database has no users. Automatically populating initial seed data...');
    await seedData(false);
  }
}

if (require.main === module) {
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await seedData(true);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seedData, autoSeed };
