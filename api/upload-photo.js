const AWS = require('aws-sdk'); // AWS SDK v2
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer S3 configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    }),
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
});

// Endpoint for uploading the photo
app.post('/api/upload-photo', upload.single('photoFile'), (req, res) => {
    console.log('Upload request received');
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File uploaded to S3:', req.file.location);
    const imageUrl = req.file.location;
    res.json({ message: 'Upload successful', url: imageUrl });
});