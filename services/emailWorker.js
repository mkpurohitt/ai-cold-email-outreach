const cron = require('node-cron');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');
const db = require('../config/database');
require('dotenv').config();

// OpenAI Config
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g. 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function processLeads() {
    console.log('Running background email worker...');

    // 1. Fetch 5 oldest PENDING leads
    let connection;
    try {
        const [leads] = await db.query('SELECT * FROM leads WHERE status = "PENDING" ORDER BY created_at ASC LIMIT 5');

        if (leads.length === 0) {
            console.log('No pending leads found.');
            return;
        }

        console.log(`Found ${leads.length} pending leads. Processing...`);

        for (const lead of leads) {
            try {
                // Update status to PROCESSING (or just keep PENDING but we want to avoid re-picking if run overlaps? 
                // For simplicity in this demo, we process sequentially. We could add a 'PROCESSING' status)
                // We'll trust the sequential nature here for the demo.

                // 2. Generate Email Content via OpenAI
                const prompt = `Write a short, professional cold email to ${lead.name}, who is the ${lead.role} at ${lead.company}. The topic is "${lead.topic}". Keep it under 150 words.`;

                const gptResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 200,
                });

                const emailBody = gptResponse.choices[0].message.content.trim();

                // 3. Send Email via Nodemailer
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: lead.email,
                    subject: `Regarding ${lead.topic}`,
                    text: emailBody
                };

                await transporter.sendMail(mailOptions);
                console.log(`Email sent to ${lead.email}`);

                // 4. Update Database
                await db.query('UPDATE leads SET status = "SENT", email_body = ? WHERE id = ?', [emailBody, lead.id]);

            } catch (error) {
                console.error(`Error processing lead ${lead.id} (${lead.email}):`, error.message);
                await db.query('UPDATE leads SET status = "FAILED" WHERE id = ?', [lead.id]);
            }
        }

    } catch (error) {
        console.error('Error in worker loop:', error);
    }
}

// Schedule task to run every minute
cron.schedule('* * * * *', () => {
    processLeads();
});

console.log('Email Background Worker initialized (Runs every minute).');
