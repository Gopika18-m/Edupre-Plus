const mongoose = require('mongoose');

// A time-stamped snapshot of a student's indicators, used to draw
// the "continuous monitoring" trend line on the student detail page.
const academicRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    attendance: { type: Number, min: 0, max: 100, required: true },
    assessmentMarks: { type: Number, min: 0, max: 100, required: true },
    assignmentCompletion: { type: Number, min: 0, max: 100, required: true },
    engagementScore: { type: Number, min: 0, max: 100, required: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    riskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], required: true },
    note: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
