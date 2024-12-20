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

    // Email content matching the design you shared
    const mailOptions = {
        from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender's email address
        to: email, // Recipient's email address
        subject: 'Your Verification Code', // Email subject
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <p style="margin-bottom: 10px;">Dear User,</p>
            <p style="margin-bottom: 20px;">
                You have selected <strong style="color: #0078E7;">${email}</strong> as your next verification page.
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #333;">${otp}</span>
            </div>
            <p style="margin-bottom: 10px; font-size: 14px; color: #555;">
                This code will expire three hours after this email was sent.
            </p>
            <p style="font-weight: bold; margin-bottom: 10px;">Why you received this email:</p>
            <p style="font-size: 14px; color: #555;">
                A verification code was requested for your email address. If you did not make this request, you can safely ignore this email.
            </p>
            <p style="font-size: 12px; color: #777; margin-top: 20px;">
                © 2024 Your App Name. All rights reserved.
            </p>
        </div>
        `,
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