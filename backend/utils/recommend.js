// Rule-based intervention suggestions ("Intervention Recommendation" step in the system flow).
function suggestRecommendations(student) {
  const s = [];
  if (student.attendance < 75)
    s.push({ category: 'Attendance', recommendation: 'Schedule attendance counseling and notify parents/guardians.' });
  if (student.assessmentMarks < 50)
    s.push({ category: 'Academic Support', recommendation: 'Enroll in remedial classes and assign a peer tutor.' });
  if (student.assignmentCompletion < 60)
    s.push({ category: 'Academic Support', recommendation: 'Set up weekly assignment check-ins with mentor.' });
  if (student.engagementScore < 50)
    s.push({ category: 'Engagement', recommendation: 'Involve student in interactive/group learning activities.' });
  if (student.riskLevel === 'High')
    s.push({ category: 'Counseling', recommendation: 'Arrange one-on-one mentoring session within this week.' });
  if (s.length === 0)
    s.push({ category: 'General', recommendation: 'Continue routine monitoring; no immediate action required.' });
  return s;
}
module.exports = { suggestRecommendations };
