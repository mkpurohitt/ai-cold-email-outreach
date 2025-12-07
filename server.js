require('dotenv').config();
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
require('./services/emailWorker'); // Start the background worker

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', apiRoutes);

// TEMPORARY: Setup Route for Database (Run once then delete or ignore)
app.get('/setup-db', async (req, res) => {
    try {
        const db = require('./config/database');
        await db.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                company VARCHAR(255),
                role VARCHAR(255),
                topic VARCHAR(255),
                status ENUM('PENDING', 'GENERATED', 'SENT', 'FAILED') DEFAULT 'PENDING',
                email_body TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        res.send('Database table "leads" created successfully! You can now upload CSVs.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating table: ' + error.message);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const initDb = async () => {
    try {
        const db = require('./config/database');
        await db.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                company VARCHAR(255),
                role VARCHAR(255),
                topic VARCHAR(255),
                status ENUM('PENDING', 'GENERATED', 'SENT', 'FAILED') DEFAULT 'PENDING',
                email_body TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

app.listen(PORT, async () => {
    await initDb();
    console.log(`Server is running on http://localhost:${PORT}`);
});
