const Student = require('../models/Student');
const AcademicRecord = require('../models/AcademicRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const { summarize, attendancePercent, isPresent, isValidDateString, latestAllowedDate } = require('../utils/attendance');
const { mentorFilter, canAccessStudent } = require('../utils/access');
const { notifyHighRisk, notifyAttendanceLow } = require('../utils/notify');

const fail = (res, err, fallback) => res.status(err.status || 500).json({ message: err.message || fallback });

// GET /api/attendance/roster?date=YYYY-MM-DD&year=2&section=A
// The class list for one day, with the status already saved (if any).
// Mentors only get their own students.
exports.getRoster = async (req, res) => {
  try {
    const { date, year, section } = req.query;
    if (!isValidDateString(date)) return res.status(400).json({ message: 'Choose a valid date (YYYY-MM-DD)' });
    const filter = { ...mentorFilter(req.user) };
    if (year) filter.year = Number(year);
    if (section) filter.section = section;

    const students = await Student.find(filter).sort({ year: 1, section: 1, name: 1 })
      .select('name rollNumber year section attendance attendanceTotalDays');
    const records = await AttendanceRecord.find({ date, student: { $in: students.map((s) => s._id) } }).select('student status');
    const byStudent = Object.fromEntries(records.map((r) => [String(r.student), r.status]));

    const rows = students.map((s) => ({
      _id: s._id, name: s.name, rollNumber: s.rollNumber, year: s.year, section: s.section,
      attendance: s.attendance, attendanceTotalDays: s.attendanceTotalDays, status: byStudent[String(s._id)] || null,
    }));
    res.json({ date, students: rows, total: rows.length, markedCount: rows.filter((r) => r.status).length });
  } catch (err) {
    fail(res, err, 'Failed to load the class list');
  }
};

// POST /api/attendance/mark   body: { date, records: [ { student, status } ] }
// Saves the day's attendance, then recalculates every affected student's attendance %,
// risk score and alerts - automatically.
exports.markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    if (date > latestAllowedDate()) return res.status(400).json({ message: 'You cannot mark attendance for a future date' });

    // one status per student (the last one wins)
    const latest = new Map();
    records.forEach((r) => latest.set(String(r.student), r.status));
    const ids = [...latest.keys()];

    // Mentors may only mark their own students
    const students = await Student.find({ _id: { $in: ids }, ...mentorFilter(req.user) });
    if (students.length !== ids.length) {
      return res.status(403).json({ message: 'You can only mark attendance for students assigned to you' });
    }

    await AttendanceRecord.bulkWrite(ids.map((id) => ({
      updateOne: { filter: { student: id, date }, update: { $set: { status: latest.get(id), markedBy: req.user._id } }, upsert: true },
    })));

    // Recalculate each student's totals from the register
    const all = await AttendanceRecord.find({ student: { $in: ids } }).select('student status');
    const totals = {};
    all.forEach((r) => {
      const t = totals[String(r.student)] || (totals[String(r.student)] = { total: 0, present: 0 });
      t.total += 1;
      if (isPresent(r.status)) t.present += 1;
    });

    const alerts = { highRisk: 0, lowAttendance: 0 };
    for (const student of students) {
      const t = totals[String(student._id)] || { total: 0, present: 0 };
      const prevAttendance = student.attendance;
      const prevLevel = student.riskLevel;
      student.attendanceTotalDays = t.total;
      student.attendancePresentDays = t.present;
      student.attendance = attendancePercent(t.present, t.total) ?? student.attendance;
      // eslint-disable-next-line no-await-in-loop
      await student.save(); // risk is recalculated here

      if (student.attendance !== prevAttendance) {
        // eslint-disable-next-line no-await-in-loop
        await AcademicRecord.create({
          student: student._id, attendance: student.attendance, assessmentMarks: student.assessmentMarks,
          assignmentCompletion: student.assignmentCompletion, engagementScore: student.engagementScore,
          riskScore: student.riskScore, riskLevel: student.riskLevel, note: `Attendance updated (${date})`,
        });
      }
      if (student.riskLevel === 'High' && prevLevel !== 'High') {
        alerts.highRisk += 1;
        // eslint-disable-next-line no-await-in-loop
        await notifyHighRisk(student);
      }
      if (prevAttendance >= 75 && student.attendance < 75) {
        alerts.lowAttendance += 1;
        // eslint-disable-next-line no-await-in-loop
        await notifyAttendanceLow(student);
      }
    }

    res.json({ date, saved: ids.length, alerts });
  } catch (err) {
    fail(res, err, 'Failed to save attendance');
  }
};

// GET /api/attendance/student/:id?days=60  (faculty, admin, and the student's own mentor)
exports.getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (!canAccessStudent(req.user, student)) return res.status(403).json({ message: 'This student is not assigned to you' });
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 60));
    const records = await AttendanceRecord.find({ student: student._id }).sort({ date: -1 }).limit(days).select('date status');
    res.json({
      records: records.map((r) => ({ date: r.date, status: r.status })),
      summary: { total: student.attendanceTotalDays, present: student.attendancePresentDays, percent: student.attendance },
      recent: summarize(records),
    });
  } catch (err) {
    fail(res, err, 'Failed to load attendance');
  }
};
