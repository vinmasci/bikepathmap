const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer configuration for file uploads
const upload = multer({
    dest: '/tmp/',  // Use '/tmp/' for serverless environments like Vercel
    limits: { fileSize: 50000000 }, // 50MB file size limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(file.originalname.toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only JPEG and PNG images are allowed');
        }
    }
}).single('photoFile');

module.exports = (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            // Read the file from /tmp directory in serverless environment
            const fileContent = fs.readFileSync(req.file.path);

            // S3 upload params
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

                // Clean up local file from /tmp
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
};
