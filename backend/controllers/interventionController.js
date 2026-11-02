const Intervention = require('../models/Intervention');
const Student = require('../models/Student');
const { suggestRecommendations } = require('../utils/recommend');
const { canDecide, canProgress } = require('../utils/workflow');
const { isStaff, canAccessStudent } = require('../utils/access');
const { notifyApprovalNeeded, notifyDecision, notifyResolved } = require('../utils/notify');

const fail = (res, err, fallback) => res.status(err.status || 500).json({ message: err.message || fallback });
const POPULATE = [
  { path: 'student', select: 'name rollNumber riskLevel mentor' },
  { path: 'proposedBy', select: 'name role' },
  { path: 'approvedBy', select: 'name role' },
];

exports.getSuggestions = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(suggestRecommendations(student));
  } catch (err) {
    fail(res, err, 'Failed to get suggestions');
  }
};

// Faculty/admin: created as Approved. Mentor: created as Proposed and waits for approval.
exports.createIntervention = async (req, res) => {
  try {
    const { student: studentId, recommendation, category } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const staff = isStaff(req.user.role);
    if (!staff && req.user.role === 'mentor') {
      // If student is assigned to another mentor, block
      if (student.mentor && String(student.mentor._id || student.mentor) !== String(req.user._id)) {
        return res.status(403).json({ message: 'This student is assigned to another mentor' });
      }
      // If student has no assigned mentor, assign this mentor
      if (!student.mentor) {
        student.mentor = req.user._id;
        await student.save();
      }
    }

    const intervention = await Intervention.create({
      student: student._id,
      recommendation,
      category: category || 'General',
      proposedBy: req.user._id,
      status: staff ? 'Approved' : 'Proposed',
      approvedBy: staff ? req.user._id : undefined,
      decidedAt: staff ? new Date() : undefined,
      decisionNote: staff ? 'Created by faculty' : '',
    });
    if (!staff) await notifyApprovalNeeded(intervention, student, req.user);
    res.status(201).json(await intervention.populate(POPULATE));
  } catch (err) {
    fail(res, err, 'Failed to create intervention');
  }
};

// GET /api/interventions?status=Proposed&studentId=...
// Mentors see their mentees' interventions + any interventions they proposed (or all if all=true)
exports.getInterventions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.student = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === 'mentor' && req.query.all !== 'true') {
      const mine = await Student.find({ mentor: req.user._id }).select('_id');
      const ids = mine.map((s) => s._id);
      if (filter.student) {
        // filter by specific student
      } else {
        filter.$or = [
          { student: { $in: ids } },
          { proposedBy: req.user._id },
        ];
      }
    }
    const list = await Intervention.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    fail(res, err, 'Failed to fetch interventions');
  }
};

// PUT /api/interventions/:id/decision   (faculty / admin)   body: { decision: 'Approved'|'Rejected', note }
exports.decideIntervention = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id);
    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });
    if (!canDecide(intervention.status)) {
      return res.status(400).json({ message: `This intervention is already ${intervention.status}` });
    }
    intervention.status = req.body.decision;
    intervention.approvedBy = req.user._id;
    intervention.decisionNote = (req.body.note || '').trim();
    intervention.decidedAt = new Date();
    await intervention.save();

    const student = await Student.findById(intervention.student);
    if (student) await notifyDecision(intervention, student, req.user);
    res.json(await intervention.populate(POPULATE));
  } catch (err) {
    fail(res, err, 'Failed to save the decision');
  }
};

// PUT /api/interventions/:id   body: { status: 'In Progress'|'Resolved', progressNote }
// Mentors may move their proposed interventions or interventions for their own students forward; faculty/admin may move any.
exports.updateIntervention = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id);
    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });
    const student = await Student.findById(intervention.student);
    
    const isProposer = String(intervention.proposedBy?._id || intervention.proposedBy) === String(req.user._id);
    const isStudentMentor = student && student.mentor && String(student.mentor._id || student.mentor) === String(req.user._id);

    if (!isStaff(req.user.role) && !isProposer && !isStudentMentor) {
      return res.status(403).json({ message: 'You are not authorized to update this intervention' });
    }

    const { status, progressNote } = req.body;
    if (status !== undefined && status !== intervention.status) {
      if (!canProgress(intervention.status, status)) {
        return res.status(400).json({ message: `Cannot change ${intervention.status} to ${status}. An intervention must be approved first.` });
      }
      intervention.status = status;
    }
    if (progressNote !== undefined) intervention.progressNote = String(progressNote).slice(0, 300);
    await intervention.save();

    if (intervention.status === 'Resolved' && req.user.role === 'mentor') await notifyResolved(intervention, student, req.user);
    res.json(await intervention.populate(POPULATE));
  } catch (err) {
    fail(res, err, 'Failed to update intervention');
  }
};
