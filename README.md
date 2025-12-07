# AI-Powered Cold Email Outreach System

A full-stack application for automating cold email outreach using OpenAI and Node.js.

## Features
- **Bulk Upload**: Upload CSV files with lead information.
- **AI Generation**: Uses OpenAI to generate personalized emails based on role and company.
- **Automated Sending**: Background utility sends emails via SMTP.
- **Dashboard**: Real-time stats on pending and sent emails.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Database Setup**
    Ensure you have MySQL installed and running.
    Run the setup script:
    ```bash
    mysql -u root -p < database_setup.sql
    ```

3.  **Environment Variables**
    Copy `.env.example` to `.env` and fill in your details:
    ```bash
    cp .env.example .env
    ```
    - `OPENAI_API_KEY`: Your OpenAI API Key.
    - `EMAIL_USER` / `EMAIL_PASS`: Your SMTP credentials (e.g., Gmail App Password).

4.  **Run Application**
    ```bash
    npm start
    ```
    Access the app at `http://localhost:3000`.

## CSV Format
The CSV should have the following headers (case-sensitive):
`Name`, `Email`, `Company`, `Role`, `Topic`
