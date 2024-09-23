const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const exifParser = require('exif-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer configuration for file uploads
const upload = multer({ dest: '/tmp/', limits: { fileSize: 50000000 } }).single('photoFile');

// MongoDB connection
let client;
async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
    }
    console.log('MongoDB connected');
    return client.db('photoApp').collection('photos');  // Use your MongoDB collection name
}

module.exports = (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error('Error uploading file: ', err.message);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const fileContent = fs.readFileSync(req.file.path);

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${Date.now().toString()}-${req.file.originalname}`,
                Body: fileContent,
                ContentType: req.file.mimetype
            };

            let latitude = null;
            let longitude = null;

            try {
                const parser = exifParser.create(fileContent);
                const exifData = parser.parse();

                console.log('EXIF Data:', exifData.tags); // Log all EXIF data for debug

                if (exifData.tags.GPSLatitude && exifData.tags.GPSLongitude) {
                    latitude = exifData.tags.GPSLatitude;
                    longitude = exifData.tags.GPSLongitude;

                    // Logging extracted coordinates for debugging
                    console.log('Extracted GPS Data:', { latitude, longitude });
                } else {
                    console.log('No GPS data found in EXIF');
                }
            } catch (exifError) {
                console.error('Error extracting EXIF data: ', exifError.message);
            }

            // Upload to S3
            s3.upload(params, async (err, data) => {
                if (err) {
                    console.error('Error uploading to S3: ', err.message);
                    return res.status(500).json({ error: 'Failed to upload to S3' });
                }

                // Connect to MongoDB
                const collection = await connectToMongo();
                
                // Insert the photo metadata into MongoDB
                const result = await collection.insertOne({
                    url: data.Location,
                    latitude: latitude,
                    longitude: longitude,
                    uploadedAt: new Date(),
                    originalName: req.file.originalname
                });

                console.log('File metadata saved to MongoDB: ', result.insertedId);

                // Respond with the S3 file URL and GPS coordinates
                res.status(200).json({
                    message: 'Upload successful',
                    url: data.Location,
                    latitude: latitude,
                    longitude: longitude,
                    dbId: result.insertedId
                });

                // Clean up local file after upload
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
                });
            });
        } catch (err) {
            console.error('Error processing upload: ', err.message);
            return res.status(500).json({ error: 'Server error during upload' });
        }
    });
};
