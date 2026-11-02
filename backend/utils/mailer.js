const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null; // email disabled
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

// Never throws: email is a bonus, in-app notifications are the main channel.
async function sendMail({ bcc, subject, text }) {
  try {
    const t = getTransporter();
    if (!t || !bcc || bcc.length === 0) return false;
    await t.sendMail({
      from: process.env.MAIL_FROM || 'EduPre Plus <no-reply@edupreplus.edu>',
      to: process.env.MAIL_FROM || 'no-reply@edupre.edu',
      bcc,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

module.exports = { sendMail };
