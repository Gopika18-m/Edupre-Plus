const Student = require('../models/Student');
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const { suggestRecommendations } = require('../utils/recommend');
const { notifyHighRisk, notifyBulkHighRisk } = require('../utils/notify');
const { mentorFilter, canAccessStudent } = require('../utils/access');

const INDICATOR_FIELDS = ['attendance', 'assessmentMarks', 'assignmentCompletion', 'engagementScore', 'previousPerformance'];
const PROFILE_FIELDS = ['name', 'email', 'department', 'year', 'section'];

// Only these fields can be set from a request (blocks setting riskScore, createdBy, etc.)
function pick(body, fields) {
  const out = {};
  fields.forEach((f) => {
    if (body[f] !== undefined) out[f] = body[f];
  });
  return out;
}

const httpError = (status, message) => Object.assign(new Error(message), { status });

// '' / null -> no mentor;  an id -> must be a real user with role "mentor"
async function resolveMentor(value) {
  if (value === undefined) return undefined;
  if (value === '' || value === null) return null;
  const mentor = await User.findOne({ _id: value, role: 'mentor' }).select('_id');
  if (!mentor) throw httpError(400, 'The selected mentor does not exist');
  return mentor._id;
}

function snapshot(student, note) {
  return AcademicRecord.create({
    student: student._id,
    attendance: student.attendance,
    assessmentMarks: student.assessmentMarks,
    assignmentCompletion: student.assignmentCompletion,
    engagementScore: student.engagementScore,
    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    note,
  });
}

function buildFilter(query) {
  const { riskLevel, year, section, search, mentor } = query;
  const filter = {};
  if (riskLevel) filter.riskLevel = riskLevel;
  if (year) filter.year = Number(year);
  if (section) filter.section = section;
  if (mentor) filter.mentor = mentor;
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { rollNumber: { $regex: safe, $options: 'i' } },
    ];
  }
  return filter;
}

const fail = (res, err, fallback) => res.status(err.status || 500).json({ message: err.message || fallback });

exports.createStudent = async (req, res) => {
  try {
    const data = pick(req.body, [...PROFILE_FIELDS, ...INDICATOR_FIELDS, 'rollNumber']);
    const mentor = await resolveMentor(req.body.mentor);
    if (mentor) data.mentor = mentor;
    const student = await Student.create({ ...data, createdBy: req.user._id });
    await snapshot(student, 'Initial record');
    if (student.riskLevel === 'High') await notifyHighRisk(student);
    res.status(201).json(await student.populate('mentor', 'name email'));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A student with this roll number already exists' });
    fail(res, err, 'Failed to create student');
  }
};

// GET /api/students?page=1&limit=10&riskLevel=High&search=abc&mentor=<id>
// Mentors automatically see only their own students.
exports.getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const showAll = req.query.all === 'true' || req.query.scope === 'all';
    const filter = { ...buildFilter(req.query), ...(showAll ? {} : mentorFilter(req.user)) };
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ riskScore: -1, name: 1 }).skip((page - 1) * limit).limit(limit).populate('mentor', 'name email'),
      Student.countDocuments(filter),
    ]);
    res.json({ students, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    fail(res, err, 'Failed to fetch students');
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('mentor', 'name email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (req.user.role === 'student') return res.status(403).json({ message: 'Students cannot view other student profiles' });
    const history = await AcademicRecord.find({ student: student._id }).sort({ recordedAt: 1 });
    res.json({ student, history });
  } catch (err) {
    fail(res, err, 'Failed to fetch student');
  }
};

// GET /api/students/me  (for logged-in students: matched by account email)
exports.getMyProgress = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email }).populate('mentor', 'name email');
    if (!student) {
      return res.status(404).json({ message: 'No student record is linked to your email yet. Please contact your mentor.' });
    }
    const [history, records] = await Promise.all([
      AcademicRecord.find({ student: student._id }).sort({ recordedAt: 1 }),
      AttendanceRecord.find({ student: student._id }).sort({ date: -1 }).limit(60).select('date status'),
    ]);
    res.json({
      student, history, suggestions: suggestRecommendations(student),
      attendance: {
        records: records.map((r) => ({ date: r.date, status: r.status })),
        total: student.attendanceTotalDays, present: student.attendancePresentDays, percent: student.attendance,
      },
    });
  } catch (err) {
    fail(res, err, 'Failed to load your progress');
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const updates = pick(req.body, [...PROFILE_FIELDS, ...INDICATOR_FIELDS]);
    // Once daily attendance is being recorded, the percentage is calculated, not typed.
    if (student.attendanceTotalDays > 0) delete updates.attendance;

    const indicatorsChanged = INDICATOR_FIELDS.some((f) => updates[f] !== undefined && updates[f] !== student[f]);
    const previousLevel = student.riskLevel;

    Object.assign(student, updates);
    const mentor = await resolveMentor(req.body.mentor);
    if (mentor !== undefined) student.mentor = mentor === null ? undefined : mentor;
    await student.save(); // recalculates risk

    if (indicatorsChanged) await snapshot(student, req.body.note || 'Indicators updated');
    if (student.riskLevel === 'High' && previousLevel !== 'High') await notifyHighRisk(student);

    res.json(await student.populate('mentor', 'name email'));
  } catch (err) {
    fail(res, err, 'Failed to update student');
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await Promise.all([
      AcademicRecord.deleteMany({ student: student._id }),
      AttendanceRecord.deleteMany({ student: student._id }),
    ]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    fail(res, err, 'Failed to delete student');
  }
};

// POST /api/students/bulk   body: { students: [ {...}, {...} ] }  (max 500 rows)
// A row may contain "mentorEmail" to assign the student to a mentor.
exports.bulkCreate = async (req, res) => {
  try {
    const rows = Array.isArray(req.body.students) ? req.body.students : null;
    if (!rows || rows.length === 0) return res.status(400).json({ message: 'No students provided' });
    if (rows.length > 500) return res.status(400).json({ message: 'Upload at most 500 students at a time' });

    const mentors = await User.find({ role: 'mentor' }).select('email');
    const mentorByEmail = Object.fromEntries(mentors.map((m) => [m.email, m._id]));

    const created = [];
    const skipped = [];
    let highCount = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || {};
      const label = row.rollNumber || `row ${i + 1}`;
      if (!row.name || !row.rollNumber) {
        skipped.push({ row: label, reason: 'Name and roll number are required' });
        continue;
      }
      const data = pick(row, [...PROFILE_FIELDS, ...INDICATOR_FIELDS, 'rollNumber']);
      const bad = INDICATOR_FIELDS.find((f) => data[f] !== undefined && !(Number(data[f]) >= 0 && Number(data[f]) <= 100));
      if (bad) {
        skipped.push({ row: label, reason: `${bad} must be between 0 and 100` });
        continue;
      }
      INDICATOR_FIELDS.forEach((f) => {
        if (data[f] !== undefined) data[f] = Number(data[f]);
      });
      if (data.year !== undefined) data.year = Number(data.year);
      if (row.mentorEmail) {
        const id = mentorByEmail[String(row.mentorEmail).trim().toLowerCase()];
        if (!id) {
          skipped.push({ row: label, reason: 'Mentor e-mail not found' });
          continue;
        }
        data.mentor = id;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const student = await Student.create({ ...data, createdBy: req.user._id });
        // eslint-disable-next-line no-await-in-loop
        await snapshot(student, 'Imported');
        if (student.riskLevel === 'High') highCount += 1;
        created.push(student._id);
      } catch (err) {
        skipped.push({ row: label, reason: err.code === 11000 ? 'Roll number already exists' : err.message });
      }
    }

    await notifyBulkHighRisk(highCount);
    res.status(201).json({ createdCount: created.length, skippedCount: skipped.length, skipped });
  } catch (err) {
    fail(res, err, 'Bulk upload failed');
  }
};
