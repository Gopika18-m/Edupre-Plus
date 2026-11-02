// Intervention workflow rules (pure functions, unit tested).
//   Proposed  --faculty/admin decides-->  Approved | Rejected
//   Approved  --> In Progress --> Resolved
const PROGRESS_STEPS = {
  Approved: ['In Progress', 'Resolved'],
  'In Progress': ['Resolved'],
};

function canDecide(status) {
  return status === 'Proposed';
}

function canProgress(from, to) {
  return (PROGRESS_STEPS[from] || []).includes(to);
}

module.exports = { canDecide, canProgress, PROGRESS_STEPS };
