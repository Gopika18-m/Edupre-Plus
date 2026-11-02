const Student = require('../models/Student');
const Intervention = require('../models/Intervention');
const AttendanceRecord = require('../models/AttendanceRecord');
const { mentorFilter, isStaff } = require('../utils/access');
const { isValidDateString, isPresent } = require('../utils/attendance');

// GET /api/dashboard/summary?today=YYYY-MM-DD
// Numbers are scoped: a mentor sees only his or her own students.
exports.getSummary = async (req, res) => {
  try {
    const scope = mentorFilter(req.user);
    const today = isValidDateString(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10);

    const students = await Student.find(scope).select('riskLevel attendance assessmentMarks');
    const riskBreakdown = { Low: 0, Moderate: 0, High: 0 };
    let attSum = 0;
    let marksSum = 0;
    students.forEach((s) => {
      riskBreakdown[s.riskLevel] += 1;
      attSum += s.attendance;
      marksSum += s.assessmentMarks;
    });
    const n = students.length || 1;
    const ids = students.map((s) => s._id);

    const topAtRisk = await Student.find({ ...scope, riskLevel: 'High' }).sort({ riskScore: -1 }).limit(5)
      .select('name rollNumber riskScore riskLevel attendance assessmentMarks');

    const records = await AttendanceRecord.find({ date: today, student: { $in: ids } }).select('status');
    const attendanceToday = {
      date: today, total: students.length, marked: records.length,
      present: records.filter((r) => isPresent(r.status)).length,
    };
    attendanceToday.absent = attendanceToday.marked - attendanceToday.present;

    const base = {
      totalStudents: students.length, riskBreakdown, avgAttendance: attSum / n, avgAssessment: marksSum / n,
      topAtRisk, attendanceToday,
    };

    if (isStaff(req.user.role)) {
      const [pendingApprovals, activeInterventions] = await Promise.all([
        Intervention.countDocuments({ status: 'Proposed' }),
        Intervention.countDocuments({ status: { $in: ['Approved', 'In Progress'] } }),
      ]);
      return res.json({ ...base, pendingApprovals, activeInterventions });
    }

    // mentor: own proposals by status + active interventions for own students
    const [mine, active] = await Promise.all([
      Intervention.find({ proposedBy: req.user._id }).select('status'),
      Intervention.countDocuments({ student: { $in: ids }, status: { $in: ['Approved', 'In Progress'] } }),
    ]);
    const myProposals = { Proposed: 0, Approved: 0, Rejected: 0, 'In Progress': 0, Resolved: 0 };
    mine.forEach((i) => { myProposals[i.status] += 1; });
    res.json({ ...base, myProposals, activeInterventions: active });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load dashboard summary' });
  }
};
