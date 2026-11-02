const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    // student: sees own progress | mentor: mentors assigned students, proposes interventions
    // faculty: manages students, approves interventions | admin: everything + users + reports
    role: { type: String, enum: ['student', 'mentor', 'faculty', 'admin'], default: 'faculty' },
    department: { type: String, default: 'Information Technology' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role, department: this.department };
};

module.exports = mongoose.model('User', userSchema);
