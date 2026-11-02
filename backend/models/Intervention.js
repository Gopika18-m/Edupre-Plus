const mongoose = require('mongoose');

// Workflow:  Proposed (by mentor) -> Approved | Rejected (by faculty/admin)
//            Approved -> In Progress -> Resolved
// An intervention created by faculty/admin is Approved straight away.
const interventionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    recommendation: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Attendance', 'Academic Support', 'Engagement', 'Counseling', 'General'],
      default: 'General',
    },
    status: {
      type: String,
      enum: ['Proposed', 'Approved', 'Rejected', 'In Progress', 'Resolved'],
      default: 'Proposed',
      index: true,
    },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decisionNote: { type: String, default: '' },
    decidedAt: { type: Date },
    progressNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Intervention', interventionSchema);
