const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Load API routes from the "api" directory, with specific paths
app.use('/api/delete-drawn-route', require('./api/delete-drawn-route'));
app.use('/api/get-drawn-routes', require('./api/get-drawn-routes'));
app.use('/api/save-drawn-route', require('./api/save-drawn-route'));
app.use('/api/snap-to-road', require('./api/snap-to-road'));
app.use('/api/get-photos', require('./api/get-photos'));
app.use('/api/delete-photo', require('./api/delete-photo'));
app.use('/api/upload-photo', require('./api/upload-photo'));

// Serve index.html for all other routes to support client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
