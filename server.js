const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Google Drive setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// OAuth2 Routes
app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file']
    });
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.redirect('/?auth=success');
    } catch (error) {
        console.error('Error during OAuth2 callback:', error);
        res.redirect('/?auth=error');
    }
});

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!oauth2Client.credentials) {
        return res.status(401).json({ error: 'Not authenticated. Please authenticate with Google Drive first.' });
    }
    next();
};

// Routes
app.post('/upload', isAuthenticated, upload.single('xmlFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate file extension
        if (!req.file.originalname.toLowerCase().endsWith('.xml')) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Only XML files are allowed' });
        }

        const xmlFilePath = req.file.path;
        const excelFilePath = xmlFilePath.replace('.xml', '.xlsx');

        // Convert XML to Excel using Python script
        const { exec } = require('child_process');
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        
        console.log('Running:', `${pythonCommand} xml_to_excel.py "${xmlFilePath}" "${excelFilePath}"`);
        
        exec(`${pythonCommand} xml_to_excel.py "${xmlFilePath}" "${excelFilePath}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error('Python script error:', error);
                console.error('Python script stderr:', stderr);
                console.error('Python script stdout:', stdout);
                fs.unlinkSync(xmlFilePath);
                return res.status(500).json({ error: 'Conversion failed: ' + (stderr || error.message) });
            }

            // Upload to Google Drive
            try {
                const fileMetadata = {
                    name: path.basename(excelFilePath),
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                };

                const media = {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    body: fs.createReadStream(excelFilePath)
                };

                const response = await drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                });

                // Clean up temporary files
                fs.unlinkSync(xmlFilePath);
                fs.unlinkSync(excelFilePath);

                res.json({
                    message: 'File uploaded to Google Drive successfully',
                    fileId: response.data.id
                });
            } catch (error) {
                console.error('Google Drive upload error:', error);
                // Clean up files in case of error
                if (fs.existsSync(xmlFilePath)) fs.unlinkSync(xmlFilePath);
                if (fs.existsSync(excelFilePath)) fs.unlinkSync(excelFilePath);
                res.status(500).json({ error: 'Google Drive upload failed: ' + error.message });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 