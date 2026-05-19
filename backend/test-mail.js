require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
  console.log('Testing email with:');
  console.log('User:', process.env.EMAIL_USER);
  console.log('Pass:', process.env.EMAIL_PASS ? '********' : 'NOT SET');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('Port:', process.env.EMAIL_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // send to self
      subject: 'Test Email from System',
      text: 'If you see this, email sending is working correctly.'
    });
    console.log('Success!', info.response);
  } catch (error) {
    console.error('Failed!', error);
  }
}

testMail();
