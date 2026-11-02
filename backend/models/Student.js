const mongoose = require('mongoose');
const { computeRisk, WEIGHTS } = require('../utils/risk');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    department: { type: String, default: 'Information Technology' },
    year: { type: Number, min: 1, max: 4, default: 1 },
    section: { type: String, default: 'A' },
    // The mentor (a User with role "mentor") responsible for this student
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    // Core indicators (0-100 scale each)
    attendance: { type: Number, min: 0, max: 100, default: 100 },
    assessmentMarks: { type: Number, min: 0, max: 100, default: 100 },
    assignmentCompletion: { type: Number, min: 0, max: 100, default: 100 },
    engagementScore: { type: Number, min: 0, max: 100, default: 100 },
    previousPerformance: { type: Number, min: 0, max: 100, default: 100 },

    // Filled automatically from the daily attendance register.
    // Once attendanceTotalDays > 0 the "attendance" percentage above is calculated, not typed.
    attendanceTotalDays: { type: Number, default: 0 },
    attendancePresentDays: { type: Number, default: 0 },

    // Derived fields, recalculated on every save
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    riskFactors: [{ type: String }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.index({ riskLevel: 1, riskScore: -1 });
studentSchema.index({ year: 1, section: 1 });

studentSchema.pre('save', function (next) {
  const { riskScore, riskLevel, riskFactors } = computeRisk(this);
  this.riskScore = riskScore;
  this.riskLevel = riskLevel;
  this.riskFactors = riskFactors;
  next();
});

studentSchema.statics.computeRisk = computeRisk;
studentSchema.statics.WEIGHTS = WEIGHTS;

module.exports = mongoose.model('Student', studentSchema);
