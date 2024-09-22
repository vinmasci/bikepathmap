const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();  // Ensure .env is loaded correctly

// AWS S3 configuration
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
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    }
}).single('photoFile');

// This is the function to handle the photo upload request in a serverless environment
module.exports = (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            // Read the file from the /tmp/ directory (Vercel's temp storage)
            const fileContent = fs.readFileSync(req.file.path);

            // Create parameters for S3 upload
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${Date.now().toString()}-${req.file.originalname}`,
                Body: fileContent,
                ACL: 'public-read',
                ContentType: req.file.mimetype  // Correct content type (e.g., 'image/jpeg')
            };

            // Upload the file to S3
            s3.upload(params, (err, data) => {
                if (err) {
                    console.error('Error uploading to S3:', err);
                    return res.status(500).json({ error: 'Failed to upload to S3' });
                }

                // Respond with the S3 file URL
                res.status(200).json({ message: 'Upload successful', url: data.Location });

                // Clean up local file after upload
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Failed to delete local file:', unlinkErr);
                    }
                });
            });
        } catch (err) {
            console.error('Error processing upload:', err);
            return res.status(500).json({ error: 'Server error during upload' });
        }
    });
};
