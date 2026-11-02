const User = require('../models/User');
const Student = require('../models/Student');
const AcademicRecord = require('../models/AcademicRecord');
const generateToken = require('../utils/generateToken');

// Public sign-up allows registering as Faculty, Mentor, or Student.
// Admin accounts are managed by existing Admins.
exports.register = async (req, res) => {
  try {
    const { name, email, password, department, role, rollNumber, year, section } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Allowed self-registration roles: faculty, mentor, student
    const validRoles = ['faculty', 'mentor', 'student'];
    const chosenRole = validRoles.includes(role) ? role : 'faculty';

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: (name || '').trim(),
      email: cleanEmail,
      password,
      role: chosenRole,
      department: department || 'Information Technology',
    });

    // If role is student, link or create their Student profile so MyProgress works immediately
    if (chosenRole === 'student') {
      const studentRoll = (rollNumber || '').trim() || `310624205${Math.floor(100 + Math.random() * 900)}`;
      
      let student = await Student.findOne({
        $or: [{ email: cleanEmail }, { rollNumber: studentRoll }],
      });

      if (student) {
        student.email = cleanEmail;
        student.name = (name || '').trim();
        if (department) student.department = department;
        await student.save();
      } else {
        student = await Student.create({
          name: (name || '').trim(),
          rollNumber: studentRoll,
          email: cleanEmail,
          department: department || 'Information Technology',
          year: Number(year) || 1,
          section: section || 'A',
          attendance: 100,
          assessmentMarks: 85,
          assignmentCompletion: 90,
          engagementScore: 85,
          previousPerformance: 80,
          attendanceTotalDays: 0,
          attendancePresentDays: 0,
        });

        await AcademicRecord.create({
          student: student._id,
          attendance: student.attendance,
          assessmentMarks: student.assessmentMarks,
          assignmentCompletion: student.assignmentCompletion,
          engagementScore: student.engagementScore,
          riskScore: student.riskScore,
          riskLevel: student.riskLevel,
          note: 'Initial student registration profile',
        });
      }
    }

    res.status(201).json({ token: generateToken(user), user: user.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account or student record with these credentials already exists' });
    }
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: generateToken(user), user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};
