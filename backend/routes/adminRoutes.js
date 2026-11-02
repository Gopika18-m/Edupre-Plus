const express = require('express');
const router = express.Router();
const c = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { adminUserRules } = require('../middleware/rules');

// Dropdown of mentors: faculty and admin need it when assigning students
router.get('/mentors', protect, requireRole('faculty', 'admin'), c.listMentors);

router.use(protect, requireRole('admin'));

router.route('/users').get(c.listUsers).post(adminUserRules, validate, c.createUser);
router.route('/users/:id').put(c.updateUser).delete(c.deleteUser);

router.get('/reports', c.getReports);
router.get('/reports/export', c.exportCsv);

module.exports = router;
