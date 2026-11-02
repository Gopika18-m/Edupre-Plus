const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    // risk: student became High risk | attendance: attendance fell below 75%
    // approval: a mentor proposed an intervention | decision: faculty approved/rejected | progress: intervention update
    type: { type: String, enum: ['risk', 'attendance', 'approval', 'decision', 'progress', 'system'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // page to open when the notification is clicked
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
