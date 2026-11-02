// Weighted risk model from the project deck:
// Attendance 30%, Assessment 30%, Assignments 20%, Engagement 10%, Previous performance 10%.
const WEIGHTS = {
  attendance: 0.3,
  assessmentMarks: 0.3,
  assignmentCompletion: 0.2,
  engagementScore: 0.1,
  previousPerformance: 0.1,
};

function computeRisk(doc) {
  const performanceScore =
    doc.attendance * WEIGHTS.attendance +
    doc.assessmentMarks * WEIGHTS.assessmentMarks +
    doc.assignmentCompletion * WEIGHTS.assignmentCompletion +
    doc.engagementScore * WEIGHTS.engagementScore +
    doc.previousPerformance * WEIGHTS.previousPerformance;

  const riskScore = Math.max(0, Math.min(100, Math.round(100 - performanceScore)));

  let riskLevel = 'Low';
  if (riskScore >= 60) riskLevel = 'High';
  else if (riskScore >= 30) riskLevel = 'Moderate';

  const riskFactors = [];
  if (doc.attendance < 75) riskFactors.push('Low Attendance');
  if (doc.assessmentMarks < 50) riskFactors.push('Poor Assessment Marks');
  if (doc.assignmentCompletion < 60) riskFactors.push('Incomplete Assignments');
  if (doc.engagementScore < 50) riskFactors.push('Low Engagement');
  if (doc.previousPerformance < 50) riskFactors.push('Weak Prior Performance');

  return { riskScore, riskLevel, riskFactors };
}

module.exports = { computeRisk, WEIGHTS };
