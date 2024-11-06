const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
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
    return client.db('roadApp').collection('profileDoc'); // Use the profileDoc collection
}

// Middleware for JWT authentication
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

// Update or create user profile handler
module.exports = async (req, res) => {
    authenticateJWT(req, res, async () => {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err.message);
                return res.status(400).json({ error: err.message });
            }

            const { name } = req.body;
            const image = req.file;

            try {
                const collection = await connectToMongo();
                const userId = req.user.id;
                console.log('User ID:', userId);

                // Check if profile exists
                const existingProfile = await collection.findOne({ _id: new ObjectId(userId) });
                
                // If no profile exists, create one
                if (!existingProfile) {
                    console.log("Profile not found, creating a new one...");
                    await collection.insertOne({ _id: new ObjectId(userId), name, profileImage: "" });
                }

                // Process the image upload if present
                let profileImageUrl = existingProfile ? existingProfile.profileImage : "";
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
                    { _id: new ObjectId(userId) },
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
