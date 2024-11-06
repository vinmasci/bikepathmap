const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');  // Ensure JWT is imported
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

// MongoDB connection
let client;
async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
    }
    console.log('MongoDB connected');
    return client.db('roadApp').collection('users'); // Connect to the 'users' collection
}

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.error("Token not provided");
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return res.sendStatus(403);
        }

        if (!user.id) {
            console.error("User ID missing in token payload");
            return res.sendStatus(403);
        }

        req.user = user;  // Attach the user to the request
        console.log("Authenticated user:", req.user);  // Log user info for verification
        next();
    });
};

// Update user profile handler
module.exports = (req, res) => {
    // Authenticate the user first
    authenticateJWT(req, res, () => {
        // Handle file uploads after authentication
        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err.message);
                return res.status(400).json({ error: err.message });
            }

            const { name } = req.body; // Get name from form data
            const image = req.file; // Get the uploaded file

            if (!image) {
                console.error('No image uploaded');
                return res.status(400).json({ error: 'No image uploaded' });
            }

            try {
                const fileContent = fs.readFileSync(image.path); // Read the file content

                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `${Date.now().toString()}-${image.originalname}`, // Unique file name
                    Body: fileContent,
                    ContentType: image.mimetype
                };

                // Upload the file to S3
                const s3Data = await s3.upload(params).promise();
                console.log('Upload successful. File URL:', s3Data.Location);

                const collection = await connectToMongo();

                // Get user ID from the authenticated user
                const userId = req.user.id; 
                console.log('User ID:', userId);

                // Update user profile with name and image URL
                const updateData = {
                    name,
                    profileImage: s3Data.Location // Save the S3 URL in the update data
                };

                // Update user profile in the database
                const result = await collection.updateOne({ _id: userId }, { $set: updateData });
                console.log('Update result:', result);

                // Clean up local file after upload
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
