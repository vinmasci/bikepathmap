const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Load API routes from the "api" directory
app.use('/api', require('./api/delete-drawn-route'));  // Adjust as necessary for each route
app.use('/api', require('./api/get-drawn-route'));
app.use('/api', require('./api/save-drawn-route'));
app.use('/api', require('./api/snap-to-road'));
app.use('/api', require('./api/get-photos'));
app.use('/api', require('./api/delete-photo'));
app.use('/api', require('./api/upload-photo'));

// Serve index.html for all other routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
