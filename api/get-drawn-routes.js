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

        // Format the routes and convert $numberDouble/$numberInt into regular numbers
        const formattedRoutes = routes.map(route => {
            // Fix coordinates for each feature
            route.geojson.features.forEach(feature => {
                feature.geometry.coordinates = feature.geometry.coordinates.map(coordPair => [
                    parseFloat(coordPair[0]?.$numberDouble || coordPair[0]), // Handle $numberDouble and convert to float
                    parseFloat(coordPair[1]?.$numberDouble || coordPair[1])  // Handle $numberDouble and convert to float
                ]);
            });
    
            return {
                routeId: route._id.toString(),
                geojson: route.geojson,  // Return the properly formatted GeoJSON
                gravelType: route.gravelType  // Return the gravel type
            };
        });

        // Send the formatted routes to the client
        res.status(200).json({ routes: formattedRoutes });
    } catch (error) {
        console.error('Error retrieving routes:', error);
        res.status(500).json({ error: 'Failed to retrieve routes' });
    } finally {
        // Optionally close the connection if this is a short-lived process
        // await client.close(); // Uncomment if you prefer closing the connection after each request
    }
};
