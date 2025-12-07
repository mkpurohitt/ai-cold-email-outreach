const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../config/database');

const upload = multer({ dest: 'uploads/' });

// POST /upload - Parse CSV and insert leads
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (data) => {
            // Normalize keys to lowercase
            const normalizedData = {};
            Object.keys(data).forEach(key => normalizedData[key.toLowerCase()] = data[key]);

            console.log('Processing row:', normalizedData);

            const name = normalizedData['name'];
            const email = normalizedData['email'];

            if (name && email) {
                results.push([
                    name,
                    email,
                    normalizedData['company'] || '',
                    normalizedData['role'] || '',
                    normalizedData['topic'] || '',
                    'PENDING'
                ]);
            } else {
                console.warn('Skipping row (missing name/email):', normalizedData);
            }
        })
        .on('end', async () => {
            try {
                if (results.length > 0) {
                    // Use ON DUPLICATE KEY UPDATE so if we re-upload failed leads, they become PENDING again
                    const query = `
                        INSERT INTO leads (name, email, company, role, topic, status) 
                        VALUES ? 
                        ON DUPLICATE KEY UPDATE status = 'PENDING'
                    `;
                    await db.query(query, [results]);
                    console.log(`Successfully inserted/updated ${results.length} leads.`);
                } else {
                    console.warn('No leads to insert.');
                }

                // Clean up uploaded file
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

                if (results.length === 0) {
                    return res.status(400).json({ error: 'No valid leads found. Check CSV headers (Name, Email required).' });
                }

                res.json({ message: `Successfully processed ${results.length} leads.` });
            } catch (error) {
                console.error('Database insertion error:', error);
                res.status(500).json({ error: 'Database error: ' + error.message });
            }
        })
        .on('error', (error) => {
            console.error('CSV processing error:', error);
            res.status(500).json({ error: 'Failed to process CSV file' });
        });
});

// GET /stats - Get counts of leads by status
router.get('/stats', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status');

        const stats = {
            PENDING: 0,
            GENERATED: 0,
            SENT: 0,
            FAILED: 0,
            TOTAL: 0
        };

        rows.forEach(row => {
            stats[row.status] = row.count;
            stats.TOTAL += row.count;
        });

        res.json(stats);
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
