const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // If no SMTP_HOST is defined, just log the email to console (Development mode)
    if (!process.env.SMTP_HOST) {
        console.log('----------------------------------------------------');
        console.log('WARNING: SMTP_HOST not defined. Email not sent.');
        console.log('To: ' + options.email);
        console.log('Subject: ' + options.subject);
        console.log('Message: ' + options.message);
        console.log('HTML: ' + options.html);
        console.log('----------------------------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Financ App'} <${process.env.FROM_EMAIL || 'noreply@financ.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
