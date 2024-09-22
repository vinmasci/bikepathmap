const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Loads environment variables

const app = express();
const port = process.env.PORT || 3000;

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer setup for file upload
const upload = multer({ dest: 'uploads/' }); // Save files locally first

// File upload route
app.post('/api/upload-photo', upload.single('photoFile'), (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Read the file from the local folder
        const fileContent = fs.readFileSync(req.file.path);

        // Create params for S3 upload
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now().toString()}-${req.file.originalname}`, // File name
            Body: fileContent,
            ACL: 'public-read',
            ContentType: req.file.mimetype // Image type (e.g., 'image/jpeg')
        };

        // Upload to S3
        s3.upload(params, (err, data) => {
            if (err) {
                console.error('Error uploading to S3:', err);
                return res.status(500).json({ error: 'Failed to upload to S3' });
            }

            // Successful upload
            res.status(200).json({ message: 'Upload successful', url: data.Location });

            // Delete the local file after upload
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Failed to delete local file:', unlinkErr);
                }
            });
        });
    } catch (err) {
        console.error('Error processing upload:', err);
        res.status(500).json({ error: 'Server error during upload' });
    }
});

// Serve static frontend files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
