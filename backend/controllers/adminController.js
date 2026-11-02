const User = require('../models/User');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

const fail = (res, err, fallback) => res.status(err.status || 500).json({ message: err.message || fallback });
const ROLES = ['student', 'mentor', 'faculty', 'admin'];

// ---------- Users ----------
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    fail(res, err, 'Failed to load users');
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    const user = await User.create({ name, email, password, role, department });
    res.status(201).json(user.toSafeObject());
  } catch (err) {
    fail(res, err, 'Failed to create user');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, name, department } = req.body;
    if (role && !ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (String(req.params.id) === String(req.user._id) && role && role !== req.user.role) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    const before = await User.findById(req.params.id);
    if (!before) return res.status(404).json({ message: 'User not found' });
    const updates = {};
    if (role) updates.role = role;
    if (name) updates.name = name;
    if (department) updates.department = department;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    // a person who stops being a mentor no longer has mentees
    if (before.role === 'mentor' && role && role !== 'mentor') await Student.updateMany({ mentor: before._id }, { $unset: { mentor: 1 } });
    res.json(user);
  } catch (err) {
    fail(res, err, 'Failed to update user');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'mentor') await Student.updateMany({ mentor: user._id }, { $unset: { mentor: 1 } });
    await Notification.deleteMany({ user: user._id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    fail(res, err, 'Failed to delete user');
  }
};

// ---------- Reports (grouped in JavaScript so it works on any MongoDB-compatible server) ----------
const round = (n) => Math.round((n || 0) * 10) / 10;

function group(students, keyFn, extra) {
  const map = new Map();
  students.forEach((s) => {
    const key = keyFn(s);
    const g = map.get(key.id) || { ...extra(key), total: 0, high: 0, moderate: 0, low: 0, riskSum: 0, attSum: 0 };
    g.total += 1;
    g[s.riskLevel.toLowerCase()] += 1;
    g.riskSum += s.riskScore;
    g.attSum += s.attendance;
    map.set(key.id, g);
  });
  return [...map.values()].map(({ riskSum, attSum, ...g }) => ({ ...g, avgRisk: round(riskSum / g.total), avgAttendance: round(attSum / g.total) }));
}

exports.getReports = async (req, res) => {
  try {
    const students = await Student.find().select('year section mentor riskLevel riskScore attendance').populate('mentor', 'name');
    const byYear = group(students, (s) => ({ id: s.year }), (k) => ({ year: k.id })).sort((a, b) => a.year - b.year);
    const bySection = group(students, (s) => ({ id: `${s.year}-${s.section}` }), (k) => ({ year: Number(k.id.split('-')[0]), section: k.id.split('-')[1] }))
      .sort((a, b) => a.year - b.year || a.section.localeCompare(b.section));
    const byMentor = group(students, (s) => ({ id: s.mentor ? String(s.mentor._id) : 'none', name: s.mentor ? s.mentor.name : 'Unassigned' }),
      (k) => ({ mentor: k.name })).sort((a, b) => b.high - a.high);
    res.json({ byYear, bySection, byMentor });
  } catch (err) {
    fail(res, err, 'Failed to build report');
  }
};

const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

exports.exportCsv = async (req, res) => {
  try {
    const students = await Student.find().sort({ year: 1, section: 1, name: 1 }).populate('mentor', 'name');
    const header = ['Name', 'Roll Number', 'Email', 'Year', 'Section', 'Mentor', 'Attendance %', 'Days Present', 'Days Recorded', 'Assessment Marks',
      'Assignment Completion', 'Engagement', 'Previous Performance', 'Risk Score', 'Risk Level', 'Risk Factors'];
    const lines = [header.join(',')];
    students.forEach((s) => {
      lines.push([s.name, s.rollNumber, s.email, s.year, s.section, s.mentor ? s.mentor.name : '', s.attendance, s.attendancePresentDays,
        s.attendanceTotalDays, s.assessmentMarks, s.assignmentCompletion, s.engagementScore, s.previousPerformance, s.riskScore, s.riskLevel,
        s.riskFactors.join('; ')].map(csvCell).join(','));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="edupre-plus-student-report.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    fail(res, err, 'Failed to export report');
  }
};

// ---------- Mentor list (for dropdowns) ----------
exports.listMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('name email').sort({ name: 1 });
    res.json(mentors);
  } catch (err) {
    fail(res, err, 'Failed to load mentors');
  }
};
