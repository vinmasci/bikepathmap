const fs = require('fs');
const path = require('path');
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
    const file = req.file; // Assuming you're using multer for file uploads

    if (!file || !file.mimetype.includes('gpx')) {
        return res.status(400).json({ error: 'Invalid GPX file' });
    }

    // Define the GPX file path where the file will be saved
    const gpxFilePath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}`);
    
    try {
        // Save the GPX file to the server's filesystem
        fs.writeFileSync(gpxFilePath, file.buffer);

        const collection = await connectToMongo();

        // Insert GPX metadata into MongoDB
        const result = await collection.insertOne({
            filePath: gpxFilePath,
            uploadedAt: new Date(),
            fileName: file.originalname
        });

        // Respond with the file metadata
        return res.status(200).json({ 
            message: 'GPX file uploaded successfully!', 
            fileData: result.ops[0] 
        });
    } catch (error) {
        console.error('Error uploading GPX file:', error);
        return res.status(500).json({ error: 'Failed to upload GPX file' });
    }
};
