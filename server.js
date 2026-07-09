require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const https = require('https');
const { kv } = require('@vercel/kv');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup multer in-memory storage for handling up to 5 image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per image
        files: 5 // Max 5 files
    },
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG and WEBP images are allowed.'));
        }
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root
app.use(express.static(__dirname));

async function generateReferenceId() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    console.log("DEBUG: Available KV/REDIS environment variables:", Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS')));

    const key = `complaint_counter:${dateStr}`;
    let counter = 1;

    try {
        // INCR increments the counter. If the key doesn't exist, it sets it to 1 and returns 1.
        counter = await kv.incr(key);
        // Expire the key after 48 hours to keep the database clean
        await kv.expire(key, 172800);
    } catch (error) {
        console.error("Failed to fetch/increment counter from Vercel KV, falling back to random/timestamp:", error);
        console.error("Connection error details:", error.message);
        // Fallback in case KV database connection is down or not set up
        counter = Math.floor(1000 + Math.random() * 9000);
    }

    const counterStr = String(counter).padStart(4, '0');
    return `IMS-${dateStr}-${counterStr}`;
}

// Verification function for Cloudflare Turnstile
async function verifyTurnstile(token, ip) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.warn("Turnstile secret key not set. Skipping verification.");
        return true;
    }

    return new Promise((resolve) => {
        const postData = JSON.stringify({
            secret: secret,
            response: token,
            remoteip: ip
        });

        const options = {
            hostname: 'challenges.cloudflare.com',
            port: 443,
            path: '/turnstile/v0/siteverify',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(!!parsed.success);
                } catch (e) {
                    console.error("Error parsing Turnstile response:", e);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error("Turnstile request failed:", err);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Mailer transporter setup using environment variables
// Falls back to a mock logging transporter if credentials are not set
const getTransporter = async () => {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const secure = port === 465;

    if (user && pass) {
        return nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            }
        });
    } else {
        console.warn("WARNING: SMTP credentials not set. Falling back to console-logging mock transporter.");
        return {
            sendMail: async (mailOptions) => {
                console.log("=========================================");
                console.log("MOCK EMAIL SENT:");
                console.log(`To: ${mailOptions.to}`);
                console.log(`Subject: ${mailOptions.subject}`);
                console.log(`Body Snippet: ${mailOptions.html.substring(0, 500)}...`);
                console.log(`Attachments: ${mailOptions.attachments ? mailOptions.attachments.length : 0} files`);
                console.log("=========================================");
                return { messageId: 'mock-id-' + Math.random() };
            }
        };
    }
};

// API Endpoint to submit complaint
app.post('/api/complaint', (req, res) => {
    upload.array('images', 5)(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err.message);
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            const {
                fullName,
                companyName,
                mobile,
                email,
                address,
                serviceType,
                category,
                subject,
                description,
                priority,
                contactMethod,
                declaration,
                'cf-turnstile-response': turnstileToken
            } = req.body;

            // 1. Validation
            if (!fullName || !mobile || !email || !address || !serviceType || !category || !subject || !description) {
                return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
            }

            if (declaration !== 'true' && declaration !== true) {
                return res.status(400).json({ success: false, message: 'You must check the declaration box.' });
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
            }

            // 10-digit mobile validation
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(mobile.replace(/\s+/g, ''))) {
                return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
            }



            const referenceId = await generateReferenceId();
            const submissionTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            // Prepare attachments
            const attachments = (req.files || []).map((file, index) => ({
                filename: file.originalname || `attachment-${index + 1}.${file.mimetype.split('/')[1]}`,
                content: file.buffer
            }));

            // Get transporter
            const transporter = await getTransporter();

            // 1. Admin Email HTML Body
            const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #2D3436; margin: 0; padding: 20px; background-color: #F8F9FA; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #E9ECEF; }
                    .header { background: #1A4D2E; color: white; padding: 24px; text-align: center; border-bottom: 4px solid #ecd47c; }
                    .header h2 { margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px; }
                    .content { padding: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #E9ECEF; font-size: 14px; }
                    th { background-color: #F8F9FA; color: #1A4D2E; font-weight: bold; width: 40%; }
                    td { color: #495057; }
                    .priority-tag { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; }
                    .priority-Urgent { background: #FFF0F2; color: #D63031; }
                    .priority-High { background: #FFEAA7; color: #D63031; }
                    .priority-Medium { background: #E3FAF2; color: #00B894; }
                    .priority-Low { background: #EBF8FF; color: #0984E3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>New Customer Complaint</h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">Reference ID: ${referenceId}</div>
                    </div>
                    <div class="content">
                        <p style="font-size: 15px; margin-bottom: 20px;">A new customer complaint has been registered. Below are the submission details:</p>
                        <table>
                            <tr><th>Reference ID</th><td style="font-weight: bold; color: #1A4D2E;">${referenceId}</td></tr>
                            <tr><th>Customer Name</th><td>${fullName}</td></tr>
                            <tr><th>Company Name</th><td>${companyName || 'N/A'}</td></tr>
                            <tr><th>Phone Number</th><td>${mobile}</td></tr>
                            <tr><th>Email Address</th><td>${email}</td></tr>
                            <tr><th>Property Address</th><td>${address}</td></tr>
                            <tr><th>Service Type</th><td>${serviceType}</td></tr>
                            <tr><th>Complaint Category</th><td>${category}</td></tr>
                            <tr>
                                <th>Priority</th>
                                <td><span class="priority-tag priority-${priority}">${priority}</span></td>
                            </tr>
                            <tr><th>Preferred Contact</th><td>${contactMethod}</td></tr>
                            <tr><th>Subject</th><td style="font-weight: bold;">${subject}</td></tr>
                            <tr><th>Description</th><td>${description}</td></tr>
                            <tr><th>Submission Time</th><td>${submissionTime}</td></tr>
                        </table>
                    </div>
                </div>
            </body>
            </html>
            `;

            // 2. Customer Email HTML Body
            const customerEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #2D3436; margin: 0; padding: 20px; background-color: #F8F9FA; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #E9ECEF; }
                    .header { background: #1A4D2E; color: white; padding: 30px 24px; text-align: center; border-bottom: 4px solid #ecd47c; }
                    .header h2 { margin: 0; font-size: 24px; font-weight: bold; color: #ffd65b; }
                    .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
                    .content { padding: 30px; }
                    .ref-box { background: #E3FAF2; border: 1px dashed #00B894; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
                    .ref-id { font-size: 20px; font-weight: bold; color: #1A4D2E; font-family: monospace; letter-spacing: 1px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #E9ECEF; font-size: 13px; }
                    th { color: #1A4D2E; font-weight: bold; width: 35%; }
                    td { color: #6C757D; }
                    .footer { text-align: center; padding: 20px; background: #F8F9FA; font-size: 11px; color: #868E96; border-top: 1px solid #E9ECEF; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Ideal Management Services</h2>
                        <p>Complaint Registered Successfully</p>
                    </div>
                    <div class="content">
                        <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${fullName}</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.5; color: #495057;">
                            Thank you for contacting Ideal Management Services. Your complaint has been successfully registered in our support ticket system. 
                        </p>
                        
                        <div class="ref-box">
                            <span style="font-size: 11px; text-transform: uppercase; color: #6C757D; display: block; margin-bottom: 3px; font-weight: bold;">Complaint Reference Number</span>
                            <span class="ref-id">${referenceId}</span>
                        </div>

                        <p style="font-size: 14px; line-height: 1.5; color: #495057;">
                            Our dedicated customer support and hygiene team will review the details and contact you via your preferred method (<strong>${contactMethod}</strong>) shortly.
                        </p>

                        <h4 style="color: #1A4D2E; border-bottom: 1px solid #E9ECEF; padding-bottom: 5px; margin-top: 25px; margin-bottom: 10px;">Ticket Summary</h4>
                        <table>
                            <tr><th>Subject</th><td>${subject}</td></tr>
                            <tr><th>Service Type</th><td>${serviceType}</td></tr>
                            <tr><th>Category</th><td>${category}</td></tr>
                            <tr><th>Priority</th><td>${priority}</td></tr>
                            <tr><th>Date & Time</th><td>${submissionTime}</td></tr>
                        </table>
                    </div>
                    <div class="footer">
                        &copy; 2026 Ideal Management Services. All Rights Reserved.<br>
                        Office 09, Shubh, QueensPark, Miraroad East-401107 | Call: +91 9819977940
                    </div>
                </div>
            </body>
            </html>
            `;

            const adminEmail = process.env.ADMIN_EMAIL || 'solutions@idealmanagementservices.com';

            // Send Admin Email
            const adminMailOptions = {
                from: process.env.EMAIL_FROM || '"IMS Support System" <solutions@idealmanagementservices.com>',
                to: adminEmail,
                subject: `New Customer Complaint - ${subject}`,
                html: adminEmailHtml,
                attachments: attachments
            };

            // Send Customer Confirmation Email
            const customerMailOptions = {
                from: process.env.EMAIL_FROM || '"IMS Support" <solutions@idealmanagementservices.com>',
                to: email,
                subject: `Complaint Registered - ${referenceId}`,
                html: customerEmailHtml
            };

            // Execute email sending
            let adminMailSent = false;
            let customerMailSent = false;
            let emailError = null;

            try {
                await transporter.sendMail(adminMailOptions);
                adminMailSent = true;
            } catch (err) {
                console.error("Admin email failed:", err);
                emailError = err;
            }

            // Only attempt to send customer confirmation if admin email succeeded (or try anyway)
            try {
                await transporter.sendMail(customerMailOptions);
                customerMailSent = true;
            } catch (err) {
                console.error("Customer confirmation email failed:", err);
                // Do not overwrite emailError if admin email failed
                if (!emailError) emailError = err;
            }

            if (!adminMailSent) {
                throw new Error(`Admin notification failed: ${emailError ? emailError.message : 'Unknown error'}`);
            }

            console.log(`Complaint registered successfully: ${referenceId}`);
            return res.status(200).json({
                success: true,
                message: 'Complaint submitted successfully.',
                referenceId: referenceId
            });

        } catch (mailErr) {
            console.error("Email sending failed:", mailErr);
            return res.status(500).json({
                success: false,
                message: `Complaint registered but email notification failed: ${mailErr.message || mailErr}`
            });
        }
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = app;
module.exports.config = {
    api: {
        bodyParser: false,
    },
};


