require('dotenv').config();
const brevoEmailService = require('./services/brevoEmailService');

async function runTest() {
    console.log("Sending test email using Brevo email service...");
    const success = await brevoEmailService.sendWelcomeEmail('pullagurapawanteja@gmail.com', 'Admin');
    if (success) {
        console.log("Test email sent successfully! Please check your inbox.");
    } else {
        console.log("Test email failed to send. Check logs.");
    }
}

runTest();
