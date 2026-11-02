require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { autoSeed } = require('./utils/seed');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupre_plus';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    try {
      await autoSeed();
    } catch (seedErr) {
      console.warn('Auto-seed check/notice:', seedErr.message);
    }
    app.listen(PORT, () => console.log(`EduPre Plus API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
