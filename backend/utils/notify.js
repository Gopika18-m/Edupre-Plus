const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendMail } = require('./mailer');

const staff = () => User.find({ role: { $in: ['faculty', 'admin'] } }).select('_id email');

async function mentorUser(student) {
  if (!student.mentor) return null;
  return User.findById(student.mentor._id || student.mentor).select('_id email');
}

// remove duplicates by id
const unique = (users) => {
  const seen = new Set();
  return users.filter((u) => u && !seen.has(String(u._id)) && seen.add(String(u._id)));
};

async function send(users, base, mail) {
  if (!users.length) return;
  await Notification.insertMany(users.map((u) => ({ user: u._id, ...base })));
  if (mail) await sendMail({ bcc: users.map((u) => u.email), subject: `[EduPre Plus] ${base.title}`, text: `${base.title}\n${base.message}` });
}

// A student has just become High risk -> faculty, admin and the student's mentor. Never throws.
async function notifyHighRisk(student) {
  try {
    const users = unique([...(await staff()), await mentorUser(student)]);
    const factors = student.riskFactors?.length ? student.riskFactors.join(', ') : 'Review indicators';
    await send(users, {
      student: student._id, type: 'risk', title: `${student.name} is now High Risk`,
      message: `Risk score ${student.riskScore}. ${factors}.`, link: `/students/${student._id}`,
    }, true);
  } catch (err) { console.error('notifyHighRisk failed:', err.message); }
}

// Attendance fell below 75% -> the mentor (or faculty/admin if no mentor) and the student's own login. Never throws.
async function notifyAttendanceLow(student) {
  try {
    const mentor = await mentorUser(student);
    const people = unique([mentor, ...(mentor ? [] : await staff())]);
    const base = { student: student._id, type: 'attendance', title: `Low attendance: ${student.name}`,
      message: `Attendance is now ${student.attendance}% (below 75%).` };
    await send(people, { ...base, link: `/students/${student._id}` }, false);
    const login = student.email ? await User.findOne({ email: student.email, role: 'student' }).select('_id email') : null;
    if (login) await send([login], { ...base, title: 'Your attendance is below 75%', link: '/my-progress' }, false);
  } catch (err) { console.error('notifyAttendanceLow failed:', err.message); }
}

// A mentor proposed an intervention -> faculty and admin must approve. Never throws.
async function notifyApprovalNeeded(intervention, student, proposer) {
  try {
    await send(await staff(), {
      student: student._id, type: 'approval', title: 'Intervention waiting for approval',
      message: `${proposer.name} proposed "${intervention.recommendation}" for ${student.name}.`, link: '/interventions?status=Proposed',
    }, true);
  } catch (err) { console.error('notifyApprovalNeeded failed:', err.message); }
}

// Faculty approved or rejected a proposal -> tell the proposing mentor. Never throws.
async function notifyDecision(intervention, student, decider) {
  try {
    if (!intervention.proposedBy || String(intervention.proposedBy) === String(decider._id)) return;
    const proposer = await User.findById(intervention.proposedBy).select('_id email');
    if (!proposer) return;
    const word = intervention.status === 'Approved' ? 'approved' : 'rejected';
    await send([proposer], {
      student: student._id, type: 'decision', title: `Intervention ${word}`,
      message: `${decider.name} ${word} your proposal for ${student.name}.${intervention.decisionNote ? ' Note: ' + intervention.decisionNote : ''}`,
      link: '/interventions',
    }, false);
  } catch (err) { console.error('notifyDecision failed:', err.message); }
}

// A mentor resolved an intervention -> faculty and admin are informed. Never throws.
async function notifyResolved(intervention, student, actor) {
  try {
    const users = (await staff()).filter((u) => String(u._id) !== String(actor._id));
    await send(users, {
      student: student._id, type: 'progress', title: 'Intervention resolved',
      message: `${actor.name} marked an intervention for ${student.name} as resolved.`, link: '/interventions?status=Resolved',
    }, false);
  } catch (err) { console.error('notifyResolved failed:', err.message); }
}

// One summary notification after a bulk upload. Never throws.
async function notifyBulkHighRisk(count) {
  try {
    if (!count) return;
    await send(await staff(), {
      type: 'risk', title: `${count} student${count > 1 ? 's' : ''} flagged High Risk`,
      message: 'From a bulk upload. Open the Students page and filter by High risk.', link: '/students?riskLevel=High',
    }, true);
  } catch (err) { console.error('notifyBulkHighRisk failed:', err.message); }
}

module.exports = { notifyHighRisk, notifyAttendanceLow, notifyApprovalNeeded, notifyDecision, notifyResolved, notifyBulkHighRisk };
