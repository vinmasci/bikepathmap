const fs = require('fs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongo() {
    if (!client.isConnected()) {
        await client.connect();
    }
    return client.db('roadApp').collection('gpxRoutes');
}

// Define the route for uploading GPX files
module.exports = async (req, res) => {
    const file = req.files.gpxFile; // Assuming you're using multer for file uploads

    if (!file || !file.mimetype.includes('gpx')) {
        return res.status(400).json({ error: 'Invalid GPX file' });
    }

    const gpxFilePath = `/uploads/${Date.now()}-${file.originalname}`;
    fs.writeFileSync(gpxFilePath, file.buffer);

    try {
        const collection = await connectToMongo(); // Now inside an async function

        // Insert the GPX metadata into MongoDB
        await collection.insertOne({
            filePath: gpxFilePath,
            uploadedAt: new Date(),
            fileName: file.originalname
        });

        return res.status(200).json({ message: 'GPX file uploaded successfully!' });
    } catch (error) {
        console.error('Error uploading GPX file:', error);
        return res.status(500).json({ error: 'Failed to upload GPX file' });
    }
};
