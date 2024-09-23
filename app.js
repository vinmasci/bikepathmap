const AWS = require('aws-sdk');
const fs = require('fs');
const exifParser = require('exif-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongo() {
    if (!client.isConnected()) {
        await client.connect();
    }
    return client.db('photoApp').collection('photos');  // Use your MongoDB collection name
}

// Helper function to convert EXIF GPS coordinates to decimal degrees
function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") {
        dd = dd * -1;
    }
    return dd;
}

// Function to upload a file to S3 with EXIF parsing and MongoDB storage
async function uploadToS3(filePath, originalName, mimeType) {
    try {
        // Read the file from local storage
        const fileContent = fs.readFileSync(filePath);

        // Extract EXIF data (if available)
        let latitude = null;
        let longitude = null;
        
        try {
            const parser = exifParser.create(fileContent);
            const exifData = parser.parse();

            if (exifData.tags.GPSLatitude && exifData.tags.GPSLongitude) {
                // Convert GPS latitude and longitude to decimal degrees
                const lat = exifData.tags.GPSLatitude;
                const lon = exifData.tags.GPSLongitude;
                const latRef = exifData.tags.GPSLatitudeRef || "N";
                const lonRef = exifData.tags.GPSLongitudeRef || "E";

                latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
                longitude = convertDMSToDD(lon[0], lon[1], lon[2], lonRef);
            }
        } catch (exifError) {
            console.error('Error extracting EXIF data:', exifError);
        }

        // S3 upload parameters
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now().toString()}-${originalName}`,  // Unique file name
            Body: fileContent,
            ContentType: mimeType  // Image type (e.g., 'image/jpeg')
        };

        // Uploading file to S3
        const data = await s3.upload(params).promise();
        console.log('Upload successful. File URL:', data.Location);

        // Store metadata in MongoDB
        const collection = await connectToMongo();
        const result = await collection.insertOne({
            url: data.Location,
            latitude: latitude,
            longitude: longitude,
            uploadedAt: new Date(),
            originalName: originalName
        });
        console.log('Photo metadata saved in MongoDB:', result.insertedId);

        // Clean up local file after successful upload
        fs.unlinkSync(filePath);

        // Return success along with the S3 URL and any extracted EXIF data (GPS coordinates)
        return { 
            success: true, 
            url: data.Location, 
            latitude: latitude, 
            longitude: longitude,
            dbId: result.insertedId  // MongoDB document ID
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return { success: false, error: error.message };
    }
}

// Example function call (this would typically be triggered by a route or an event)
const filePath = '/tmp/example-file.jpeg';  // Example file path
const originalName = 'example-file.jpeg';  // Example file original name
const mimeType = 'image/jpeg';  // Example mime type

uploadToS3(filePath, originalName, mimeType)
    .then(result => {
        if (result.success) {
            console.log('File successfully uploaded to S3:', result.url);
            if (result.latitude && result.longitude) {
                console.log('Coordinates:', result.latitude, result.longitude);
            } else {
                console.log('No GPS coordinates found in the EXIF data.');
            }
            console.log('MongoDB Document ID:', result.dbId);
        } else {
            console.log('Failed to upload file:', result.error);
        }
    })
    .catch(err => {
        console.error('Error during upload process:', err);
    });
