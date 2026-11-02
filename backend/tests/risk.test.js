const test = require('node:test');
const assert = require('node:assert');
const { computeRisk } = require('../utils/risk');
const { suggestRecommendations } = require('../utils/recommend');

const base = { attendance: 100, assessmentMarks: 100, assignmentCompletion: 100, engagementScore: 100, previousPerformance: 100 };

test('perfect student is Low risk with score 0', () => {
  const r = computeRisk(base);
  assert.strictEqual(r.riskScore, 0);
  assert.strictEqual(r.riskLevel, 'Low');
  assert.deepStrictEqual(r.riskFactors, []);
});

test('weak student is High risk and factors are flagged', () => {
  const r = computeRisk({ attendance: 40, assessmentMarks: 30, assignmentCompletion: 40, engagementScore: 30, previousPerformance: 40 });
  assert.strictEqual(r.riskLevel, 'High');
  assert.ok(r.riskScore >= 60);
  assert.ok(r.riskFactors.includes('Low Attendance'));
  assert.ok(r.riskFactors.includes('Poor Assessment Marks'));
});

test('middle student is Moderate risk', () => {
  const r = computeRisk({ attendance: 70, assessmentMarks: 60, assignmentCompletion: 65, engagementScore: 60, previousPerformance: 65 });
  assert.strictEqual(r.riskLevel, 'Moderate');
});

test('weights follow the deck (30/30/20/10/10)', () => {
  // Only attendance drops by 10 points -> score rises by 3
  assert.strictEqual(computeRisk({ ...base, attendance: 90 }).riskScore, 3);
  assert.strictEqual(computeRisk({ ...base, assignmentCompletion: 90 }).riskScore, 2);
});

test('score is always between 0 and 100', () => {
  const r = computeRisk({ attendance: 0, assessmentMarks: 0, assignmentCompletion: 0, engagementScore: 0, previousPerformance: 0 });
  assert.strictEqual(r.riskScore, 100);
});

test('recommendations match the problem areas', () => {
  const recs = suggestRecommendations({ ...base, attendance: 50, riskLevel: 'Moderate' });
  assert.ok(recs.some((x) => x.category === 'Attendance'));
  const ok = suggestRecommendations({ ...base, riskLevel: 'Low' });
  assert.strictEqual(ok[0].category, 'General');
});
