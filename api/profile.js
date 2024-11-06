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

// Update user profile
app.post('/api/user/profile', upload, async (req, res) => {
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
});


// Save profile information functionality in the frontend
document.getElementById('save-profile-info').addEventListener('click', async () => {
    const userName = document.getElementById('user-name').value;
    const profileImage = document.getElementById('profile-image').files[0];

    const formData = new FormData();
    formData.append('name', userName);
    if (profileImage) {
        formData.append('image', profileImage); // Add image file if exists
    }

    // Change button text to "Saving..." and disable it
    const saveButton = document.getElementById('save-profile-info');
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true; // Disable button to prevent multiple clicks

    // Send this data to your backend
    const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Send the token if necessary
        },
        body: formData // Sending FormData to include file uploads
    });

    // Reset button text and enable it
    saveButton.textContent = 'Save'; // Reset the button text
    saveButton.disabled = false; // Enable the button again

    if (response.ok) {
        console.log('Profile information saved successfully');
        document.getElementById('profile-info-modal').style.display = 'none'; // Close modal
    } else {
        console.error('Error saving profile information');
    }
});

// Close modal functionality
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('profile-info-modal').style.display = 'none'; // Close modal
});

// Logout button in the modal
document.getElementById('modal-logout-button').addEventListener('click', async () => {
    console.log("Logging out from profile modal..."); // Log when logout button is clicked
    localStorage.removeItem('token');  // Clear the token from localStorage
    userInfo.textContent = ''; // Clear user info
    logoutButton.style.display = 'none'; // Hide logout button
    loginButton.style.display = 'block'; // Show login button
    console.log("User logged out, login button will remain visible."); // Log logout event

    // Redirect to your application's logout URL
    const logoutUrl = '/'; // Redirect to your homepage or logout route
    window.location.href = logoutUrl; // Redirect to log out of the application
});
