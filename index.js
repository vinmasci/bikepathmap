const express = require('express');
const path = require('path');
const session = require('express-session'); // Session middleware for managing session IDs
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Use session middleware to generate session IDs
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// In-memory storage for route IDs
const routeIdStore = {};

// Endpoint to generate and store a unique route ID
app.post('/api/generate-route-id', (req, res) => {
    const routeId = new Date().getTime().toString(); // Generate unique route ID as a string
    const sessionId = req.sessionID || 'default'; // Use session ID or a default key

    // Store the routeId in routeIdStore
    routeIdStore[sessionId] = routeId;
    console.log("[API] Generated and stored routeId:", routeId);

    res.status(200).json({ success: true, routeId });
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Load API routes from the "api" directory
app.use('/api', require('./api/delete-drawn-route'));  // Adjust as necessary for each route
app.use('/api', require('./api/get-drawn-routes'));
app.use('/api', require('./api/save-drawn-route'));
app.use('/api', require('./api/snap-to-road'));
app.use('/api', require('./api/get-photos'));
app.use('/api', require('./api/delete-photo'));
app.use('/api', require('./api/upload-photo'));

// Serve index.html for all other routes to support client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Expose routeIdStore so other modules (like save-drawn-route) can access it
module.exports.routeIdStore = routeIdStore;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
