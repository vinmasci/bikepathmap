const { MongoClient } = require('mongodb');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer configuration for file uploads
const upload = multer({ dest: '/tmp/', limits: { fileSize: 10000000 } }).single('image'); // Handle single image uploads

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongo() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    console.log('MongoDB connected');
    return client.db('roadApp').collection('users'); // Connect to the 'users' collection
}

// Update user profile handler
module.exports = async (req, res) => {
    // Use multer to handle file uploads
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(500).json({ success: false, message: 'File upload failed' });
        }

        if (req.method === 'POST') {
            console.log('Received profile update request:', req.body);
            const { name } = req.body;
            const image = req.file; // Get the uploaded file

            try {
                const collection = await connectToMongo();

                // Assuming you have a way to identify users, like a userId from the JWT
                const userId = req.user.id; // Get user ID from the authentication middleware
                console.log('User ID:', userId);

                // Initialize an empty update object
                const updateData = { name };

                // If there is an image, upload it to S3
                if (image) {
                    console.log('Uploading image to S3:', image.originalname);
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

                    // Save the S3 URL in the update data
                    updateData.profileImage = s3Data.Location; // Store the URL of the uploaded image
                }

                // Update user profile in the database
                const result = await collection.updateOne({ _id: userId }, { $set: updateData });
                console.log('Update result:', result);

                // Clean up local file after upload
                if (image) {
                    fs.unlink(image.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
                    });
                }

                res.json({ success: true, message: 'Profile updated successfully' });
            } catch (error) {
                console.error('Error updating profile:', error);
                res.status(500).json({ success: false, message: 'Failed to update profile' });
            }
        } else {
            // Handle any HTTP method that is not POST
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    });
};