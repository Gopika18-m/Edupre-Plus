const express = require('express');
const router = express.Router();
const c = require('../controllers/attendanceController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { attendanceRules } = require('../middleware/rules');

router.use(protect, requireRole('faculty', 'admin', 'mentor'));

router.get('/roster', c.getRoster);
router.post('/mark', attendanceRules, validate, c.markAttendance);
router.get('/student/:id', c.getStudentAttendance);

module.exports = router;
