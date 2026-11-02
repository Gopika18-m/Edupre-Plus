const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/summary', protect, requireRole('faculty', 'admin', 'mentor'), getSummary);

module.exports = router;
