const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createStudentRules, updateStudentRules } = require('../middleware/rules');

router.use(protect);

// Students can only see their own progress
router.get('/me', requireRole('student'), c.getMyProgress);

// Mentors may read (their own students only - enforced in the controller)
router.get('/', requireRole('faculty', 'admin', 'mentor'), c.getStudents);
router.get('/:id', requireRole('faculty', 'admin', 'mentor'), c.getStudentById);

// Only faculty / admin may create, change or delete student records
router.post('/bulk', requireRole('faculty', 'admin'), c.bulkCreate);
router.post('/', requireRole('faculty', 'admin'), createStudentRules, validate, c.createStudent);
router.put('/:id', requireRole('faculty', 'admin'), updateStudentRules, validate, c.updateStudent);
router.delete('/:id', requireRole('faculty', 'admin'), c.deleteStudent);

module.exports = router;
