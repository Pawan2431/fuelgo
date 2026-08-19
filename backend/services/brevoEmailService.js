const https = require('https');
const logger = require('../logger');

const API_KEY = process.env.BREVO_API_KEY;
const API_HOSTNAME = 'api.brevo.com';
const API_PATH = '/v3/smtp/email';

const defaultSender = {
    email: process.env.BREVO_SENDER_EMAIL || 'no-reply@fuelgo.in',
    name: process.env.BREVO_SENDER_NAME || 'FuelGo Alerts'
};

async function sendEmail(toEmail, toName, subject, htmlContent) {
    if (!API_KEY) {
        logger.error("Failed to send email: Brevo API key is missing.");
        return false;
    }
    
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            sender: defaultSender,
            to: [{ email: toEmail, name: toName || toEmail }],
            subject: subject,
            htmlContent: htmlContent
        });

        const options = {
            hostname: API_HOSTNAME,
            path: API_PATH,
            method: 'POST',
            family: 4, // Force IPv4 to prevent Windows Node ECONNRESET bugs
            headers: {
                'accept': 'application/json',
                'api-key': API_KEY,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        logger.info(`Email sent successfully to ${toEmail}. Message ID: ${json.messageId}`);
                        resolve(true);
                    } catch(e) {
                        resolve(true); // Still successful send
                    }
                } else {
                    logger.error(`Brevo API Error (${res.statusCode}): ${data}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            logger.error(`Failed to send email to ${toEmail}: ${error.message || 'Unknown error'}`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

const brevoEmailService = {
    async sendWelcomeEmail(toEmail, toName) {
        const subject = 'Welcome to FuelGo! 🚀';
        const htmlContent = `
            <h2>Welcome to FuelGo, ${toName || 'User'}!</h2>
            <p>Thank you for registering with FuelGo. Your enterprise fuel account is now ready.</p>
            <p>You can access live bowser fleets, track fuel usage, and manage GST tax invoices directly from your dashboard.</p>
            <br/>
            <p>Best regards,<br/>The FuelGo Team</p>
        `;
        return sendEmail(toEmail, toName, subject, htmlContent);
    },

    async sendOtpEmail(toEmail, otpCode) {
        const subject = 'Your FuelGo Verification Code';
        const htmlContent = `
            <h2>FuelGo Security Verification</h2>
            <p>Your one-time password (OTP) is:</p>
            <h1 style="color: #d93025; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
            <p>Please enter this code to verify your account. The code will expire in 5 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
        `;
        return sendEmail(toEmail, null, subject, htmlContent);
    },

    async sendPasswordResetEmail(toEmail, resetCode) {
        const subject = 'FuelGo Password Reset Request';
        const htmlContent = `
            <h2>Password Reset</h2>
            <p>We received a request to reset your password. Use the following code to reset it:</p>
            <h1 style="color: #d93025; font-size: 32px; letter-spacing: 5px;">${resetCode}</h1>
            <p>If you didn't request a password reset, please ignore this email or contact support.</p>
        `;
        return sendEmail(toEmail, null, subject, htmlContent);
    },

    async sendOrderConfirmationEmail(toEmail, orderDetails) {
        const subject = `Order Confirmed - FuelGo #${orderDetails.order_id}`;
        const htmlContent = `
            <h2>Fuel Order Confirmed</h2>
            <p>Your order has been successfully placed.</p>
            <ul>
                <li><strong>Order ID:</strong> ${orderDetails.order_id}</li>
                <li><strong>Fuel Type:</strong> ${orderDetails.fuel_type}</li>
                <li><strong>Quantity:</strong> ${orderDetails.quantity_litres} Litres</li>
                <li><strong>Total Price:</strong> ₹${orderDetails.total_price.toFixed(2)}</li>
                <li><strong>Delivery Location:</strong> ${orderDetails.delivery_address}</li>
                <li><strong>Estimated Arrival:</strong> ${orderDetails.eta_minutes} mins</li>
            </ul>
            <p>Thank you for choosing FuelGo!</p>
        `;
        return sendEmail(toEmail, null, subject, htmlContent);
    }
};

module.exports = brevoEmailService;
