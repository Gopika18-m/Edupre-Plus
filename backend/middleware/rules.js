const { body } = require('express-validator');
const { isValidDateString } = require('../utils/attendance');

const score = (field, label) =>
  body(field).optional().isFloat({ min: 0, max: 100 }).withMessage(`${label} must be a number between 0 and 100`).toFloat();

const studentFields = [
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Student email is not valid'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be 1 to 4').toInt(),
  body('mentor').optional({ values: 'falsy' }).isMongoId().withMessage('Mentor is not valid'),
  score('attendance', 'Attendance'),
  score('assessmentMarks', 'Assessment marks'),
  score('assignmentCompletion', 'Assignment completion'),
  score('engagementScore', 'Engagement score'),
  score('previousPerformance', 'Previous performance'),
];

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'mentor', 'faculty']).withMessage('Role must be student, mentor, or faculty'),
  body('rollNumber').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Roll number cannot exceed 30 characters'),
  body('year').optional({ values: 'falsy' }).isInt({ min: 1, max: 4 }).withMessage('Year must be 1 to 4').toInt(),
];

exports.loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.createStudentRules = [
  body('name').trim().notEmpty().withMessage('Student name is required'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  ...studentFields,
];

exports.updateStudentRules = [
  body('name').optional().trim().notEmpty().withMessage('Student name cannot be empty'),
  ...studentFields,
];

exports.adminUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'mentor', 'faculty', 'admin']).withMessage('Role must be student, mentor, faculty or admin'),
];

exports.attendanceRules = [
  body('date').custom((v) => isValidDateString(v)).withMessage('Date must be a real date in YYYY-MM-DD format'),
  body('records').isArray({ min: 1, max: 500 }).withMessage('Send between 1 and 500 attendance records'),
  body('records.*.student').isMongoId().withMessage('Each record needs a valid student id'),
  body('records.*.status').isIn(['Present', 'Absent', 'OnDuty']).withMessage('Status must be Present, Absent or OnDuty'),
];

exports.createInterventionRules = [
  body('student').isMongoId().withMessage('A valid student is required'),
  body('recommendation').trim().notEmpty().withMessage('Describe the intervention').isLength({ max: 500 }).withMessage('Keep the description under 500 characters'),
  body('category').optional().isIn(['Attendance', 'Academic Support', 'Engagement', 'Counseling', 'General']).withMessage('Unknown category'),
];

exports.decisionRules = [
  body('decision').isIn(['Approved', 'Rejected']).withMessage('Decision must be Approved or Rejected'),
  body('note').optional().isString().isLength({ max: 300 }).withMessage('Keep the note under 300 characters'),
  body('note').custom((v, { req }) => req.body.decision !== 'Rejected' || (typeof v === 'string' && v.trim().length > 0))
    .withMessage('Please give a reason when rejecting'),
];
