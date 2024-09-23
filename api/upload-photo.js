const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const exifParser = require('exif-parser');  // Import the EXIF parser
require('dotenv').config();  // Ensure .env is loaded correctly

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer configuration for file uploads
const upload = multer({
    dest: '/tmp/',  // Use '/tmp/' for serverless environments like Vercel
    limits: { fileSize: 50000000 }, // 50MB file size limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(file.originalname.toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    }
}).single('photoFile');

// Helper function to convert EXIF GPS coordinates to decimal degrees
function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") {
        dd = dd * -1;
    }
    return dd;
}

module.exports = (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            // Read the file from the /tmp/ directory (Vercel's temp storage)
            const fileContent = fs.readFileSync(req.file.path);

            // Create parameters for S3 upload
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${Date.now().toString()}-${req.file.originalname}`,
                Body: fileContent,
                ContentType: req.file.mimetype  // Correct content type (e.g., 'image/jpeg')
            };

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

            // Upload the file to S3
            s3.upload(params, (err, data) => {
                if (err) {
                    console.error('Error uploading to S3:', err);
                    return res.status(500).json({ error: 'Failed to upload to S3' });
                }

                // Respond with the S3 file URL and GPS coordinates (if available)
                res.status(200).json({
                    message: 'Upload successful',
                    url: data.Location,
                    latitude: latitude,
                    longitude: longitude
                });

                // Clean up local file after upload
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Failed to delete local file:', unlinkErr);
                    }
                });
            });
        } catch (err) {
            console.error('Error processing upload:', err);
            return res.status(500).json({ error: 'Server error during upload' });
        }
    });
};
