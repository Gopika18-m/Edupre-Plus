const express = require('express');
const router = express.Router();
const c = require('../controllers/interventionController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createInterventionRules, decisionRules } = require('../middleware/rules');

router.use(protect, requireRole('faculty', 'admin', 'mentor'));

router.get('/suggestions/:studentId', c.getSuggestions);
router.route('/').get(c.getInterventions).post(createInterventionRules, validate, c.createIntervention);
// Only faculty / admin can approve or reject a mentor's proposal
router.put('/:id/decision', requireRole('faculty', 'admin'), decisionRules, validate, c.decideIntervention);
router.put('/:id', c.updateIntervention);

module.exports = router;
