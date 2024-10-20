const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongo() {
    if (!client.topology || !client.topology.isConnected()) {  // Check if the client is connected
        await client.connect();  // Connect only if not connected
    }
    return client.db('roadApp').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    try {
        const collection = await connectToMongo();
        
        // Fetch all routes from the MongoDB collection
        const routes = await collection.find({}).toArray();
        
        // Format routes including necessary fields
        const formattedRoutes = routes.map(route => ({
            routeId: route._id.toString(),
            geojson: route.geojson,            // GeoJSON data for the route
            gravelType: route.gravelType       // Gravel type classification only
        }));

        // Send the formatted routes in the response
        res.status(200).json({ routes: formattedRoutes });
    } catch (error) {
        console.error('Error retrieving routes:', error);
        res.status(500).json({ error: 'Failed to retrieve routes' });
    } finally {
        // Optionally close the connection if this is a short-lived process
        // await client.close(); // Uncomment if you prefer closing the connection after each request
    }
};
//