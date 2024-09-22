const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();  // Ensure .env is loaded correctly

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION  // Ensure region is correctly set, e.g. ap-southeast-2
});

// Example function to upload a file to S3 (without Express)
async function uploadToS3(filePath, originalName, mimeType) {
    try {
        // Read the file from local storage
        const fileContent = fs.readFileSync(filePath);

        // S3 upload parameters
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,  // Ensure this is correct
            Key: `${Date.now().toString()}-${originalName}`,  // Unique file name
            Body: fileContent,
            ContentType: mimeType  // Image type (e.g., 'image/jpeg')
        };

        // Uploading file to S3
        const data = await s3.upload(params).promise();
        console.log('Upload successful. File URL:', data.Location);

        // Clean up local file after successful upload
        fs.unlinkSync(filePath);
        return { success: true, url: data.Location };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return { success: false, error: error.message };
    }
}

// Example function call (this would typically be triggered by a route or an event)
const filePath = '/tmp/example-file.jpeg';  // Example file path
const originalName = 'example-file.jpeg';  // Example file original name
const mimeType = 'image/jpeg';  // Example mime type push

uploadToS3(filePath, originalName, mimeType)
    .then(result => {
        if (result.success) {
            console.log('File successfully uploaded to S3:', result.url);
        } else {
            console.log('Failed to upload file:', result.error);
        }
    })
    .catch(err => {
        console.error('Error during upload process:', err);
    });