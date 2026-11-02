const express = require('express');
const router = express.Router();
const AcademicRecord = require('../models/AcademicRecord');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('faculty', 'admin'));

// GET /api/records/:studentId - full history for a student
router.get('/:studentId', async (req, res) => {
  try {
    const history = await AcademicRecord.find({ student: req.params.studentId }).sort({ recordedAt: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch records' });
  }
});

module.exports = router;
