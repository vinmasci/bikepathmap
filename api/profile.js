const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken'); // Make sure jwt is required here
const { MongoClient } = require('mongodb');
require('dotenv').config();

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer configuration for file uploads
const upload = multer({ dest: '/tmp/', limits: { fileSize: 10000000 } }).single('image'); // Handle single image uploads

let client;
async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
    }
    console.log('MongoDB connected');
    return client.db('roadApp').collection('users'); // Connect to the 'users' collection
}

// Middleware for JWT authentication with enhanced logging
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.error("Token not provided");
        return res.status(401).json({ error: "Token not provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                console.error("Token expired:", err.expiredAt);
                return res.status(401).json({ error: "Token expired", expiredAt: err.expiredAt });
            } else {
                console.error("Token verification failed:", err.message);
                return res.status(403).json({ error: "Token verification failed" });
            }
        }

        console.log("Token successfully verified:", decodedToken);
        req.user = { id: decodedToken.id };  // Ensure the decoded ID is set to req.user
        next();
    });
};

module.exports = authenticateJWT;


// Update user profile handler with error handling and enhanced logging
module.exports = (req, res) => {
    authenticateJWT(req, res, () => {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err.message);
                return res.status(400).json({ error: err.message });
            }

            const { name } = req.body;
            const image = req.file;

            if (!image) {
                console.error('No image uploaded');
                return res.status(400).json({ error: 'No image uploaded' });
            }

            try {
                const fileContent = fs.readFileSync(image.path);

                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `${Date.now().toString()}-${image.originalname}`,
                    Body: fileContent,
                    ContentType: image.mimetype
                };

                // Upload the file to S3
                const s3Data = await s3.upload(params).promise();
                console.log('Upload successful. File URL:', s3Data.Location);

                const collection = await connectToMongo();

                const userId = req.user.id;
                console.log('User ID:', userId);

                const updateData = {
                    name,
                    profileImage: s3Data.Location
                };

                const result = await collection.updateOne({ _id: userId }, { $set: updateData });
                console.log('Update result:', result);

                fs.unlink(image.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
                });

                res.status(200).json({ success: true, message: 'Profile updated successfully' });
            } catch (uploadError) {
                console.error('Error processing upload:', uploadError.message);
                res.status(500).json({ error: 'Server error during upload' });
            }
        });
    });
};
