require('dotenv').config(); // Add this line to load .env variables

const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000; // Set your preferred port

// Middleware to serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // For JSON handling

// Use Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI; // MongoDB URI

// Create storage engine for Multer to handle file uploads
const storage = multer.diskStorage({
    destination: './public/uploads', // Save files in public/uploads
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload with file size limit
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1 MB file size limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('photoFile');

// Check file type for image uploads (only JPEG and PNG allowed)
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Only JPEG or PNG images are allowed!');
    }
}

// API route to handle photo upload
app.post('/upload-photo', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Successfully uploaded, send back file details
        res.json({
            message: 'File uploaded successfully',
            filename: req.file.filename,
            filepath: `/uploads/${req.file.filename}`
        });
    });
});

// Serve index.html for the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
