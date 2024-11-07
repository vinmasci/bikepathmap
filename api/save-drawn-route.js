module.exports = async (req, res) => {
    console.log("[API] Received request to /api/save-drawn-route");

    if (req.method !== 'POST') {
        console.warn("[API] Invalid request method:", req.method);
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Retrieve the routeId from server-side storage
    const sessionId = req.sessionID || 'default';
    const routeId = routeIdStore[sessionId];
    console.log("[API] Session ID:", sessionId, "| Retrieved routeId:", routeId);

    if (!routeId) {
        console.error("[API] Route ID is missing in server storage.");
        return res.status(400).json({ success: false, message: 'No route ID provided in server storage.' });
    }

    const { gpxData, geojson, metadata } = req.body;
    if (!gpxData || !geojson || !metadata) {
        console.error("[API] Invalid input data. Missing gpxData, geojson, or metadata.");
        return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    // Assign routeId to metadata on the server side
    metadata.routeId = routeId;

    try {
        const collection = await connectToMongo();
        const insertData = {
            gpxData,
            geojson,
            metadata,
            createdAt: new Date()
        };
        console.log("[API] Inserting data into MongoDB:", insertData);

        const result = await collection.insertOne(insertData);

        if (result.insertedId) {
            console.log("[API] Route saved successfully with routeId:", result.insertedId);
            res.status(200).json({ success: true, message: 'Route saved successfully!', routeId: result.insertedId });
        } else {
            console.error("[API] Failed to insert route into MongoDB.");
            res.status(500).json({ success: false, message: 'Failed to save route' });
        }
    } catch (error) {
        console.error("[API] Error saving drawn route:", error);
        res.status(500).json({ success: false, message: 'Failed to save drawn route' });
    }
};
