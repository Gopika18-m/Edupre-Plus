// Who may see which students.
//  admin / faculty -> every student
//  mentor          -> can view students to propose interventions and advise; mentorFilter filters to assigned mentees by default
const isStaff = (role) => role === 'faculty' || role === 'admin';

const mentorFilter = (user) => (user.role === 'mentor' ? { mentor: user._id } : {});

function canAccessStudent(user, student) {
  if (isStaff(user.role)) return true;
  if (user.role === 'mentor') return !!student.mentor && String(student.mentor._id || student.mentor) === String(user._id);
  return false;
}

module.exports = { isStaff, mentorFilter, canAccessStudent };
