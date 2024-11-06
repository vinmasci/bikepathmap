// ============================
// SECTION: Imports and AWS Configuration
// ============================
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');  // No need for ObjectId now
require('dotenv').config();

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// ============================
// SECTION: Multer and MongoDB Configuration
// ============================
const upload = multer({ dest: '/tmp/', limits: { fileSize: 10000000 } }).single('image');

let client;
async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
    }
    console.log('MongoDB connected');
    return client.db('roadApp').collection('profileDoc'); // Use the profileDoc collection
}

// ============================
// SECTION: JWT Authentication Middleware
// ============================
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.error("Token not provided");
        return res.status(401).json({ error: "Token not provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return res.status(403).json({ error: "Token verification failed" });
        }
        console.log("Token successfully verified:", decodedToken);
        req.user = { id: decodedToken.id };  // Set decoded ID to req.user
        next();
    });
};

// ============================
// SECTION: Update or Create User Profile Handler
// ============================
module.exports = async (req, res) => {
    authenticateJWT(req, res, async () => {
        // Log to verify if `req.user` and `req.user.id` are set
        if (!req.user || !req.user.id) {
            console.error("Error: `req.user.id` is undefined. Authentication might have failed.");
            return res.status(500).json({ error: "`req.user.id` is undefined after authentication" });
        }

        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err.message);
                return res.status(400).json({ error: err.message });
            }

            const { name } = req.body;
            const image = req.file;

            try {
                const collection = await connectToMongo();
                const userId = req.user.id;  // This should now log correctly if `req.user.id` is set
                console.log('User ID:', userId);

                // Ensure profile document exists
                await ensureProfileDocument(userId, collection);

                // Process the image upload if present
                let profileImageUrl = "";
                if (image) {
                    const fileContent = fs.readFileSync(image.path);
                    const params = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: `${Date.now().toString()}-${image.originalname}`,
                        Body: fileContent,
                        ContentType: image.mimetype
                    };

                    const s3Data = await s3.upload(params).promise();
                    console.log('Upload successful. File URL:', s3Data.Location);
                    profileImageUrl = s3Data.Location;

                    fs.unlink(image.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
                    });
                }

                // Update profile document with new data
                const updateData = { name, profileImage: profileImageUrl };
                const result = await collection.updateOne(
                    { _id: userId },  // Use userId directly as a string
                    { $set: updateData },
                    { upsert: true } // Ensure document is created if it doesn't exist
                );

                console.log('Update result:', result);
                res.status(200).json({ success: true, message: 'Profile updated successfully' });
            } catch (error) {
                console.error('Error processing profile:', error.message);
                res.status(500).json({ error: 'Server error during profile processing' });
            }
        });
    });
};
