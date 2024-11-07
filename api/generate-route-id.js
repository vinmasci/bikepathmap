// Import necessary modules
const express = require('express');
const app = express();

// In-memory storage for route IDs
const routeIdStore = {};

// Endpoint to generate and store a unique route ID
app.post('/api/generate-route-id', (req, res) => {
    // Generate a unique route ID based on the current timestamp
    const routeId = new Date().getTime().toString();

    // Use a session ID if available, otherwise use a default key
    const sessionId = req.sessionID || 'default';

    // Store the routeId in routeIdStore, keyed by session ID
    routeIdStore[sessionId] = routeId;
    console.log("[API] Generated and stored routeId:", routeId, "for session:", sessionId);

    // Send the routeId back to the client
    res.status(200).json({ success: true, routeId });
});

module.exports = app;
