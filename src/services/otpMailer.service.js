const nodemailer = require('nodemailer');

// Function to generate a random OTP
function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

// Function to send OTP via email
async function sendOTP(email, otp) {
    // Transporter configuration
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use 'gmail' for Google email service
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address
            pass: process.env.EMAIL_PASS, // Your Gmail password or App Password
        },
    });

    const mailOptions = {
        from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender's email address
        to: email, // Recipient's email address
        subject: 'Your OTP for Password Reset',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`, // HTML email content
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Could not send OTP. Please try again later.');
    }
}

module.exports = { generateOTP, sendOTP };