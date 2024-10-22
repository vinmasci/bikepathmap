const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongo() {
    if (!client.topology || !client.topology.isConnected()) {  // Check if the client is connected
        await client.connect();  // Connect only if not connected
    }
    return client.db('roadApp').collection('drawnRoutes');
}

// Helper function to validate coordinates
function validateCoordinates(coord) {
    const [lon, lat] = coord;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.warn(`Invalid coordinates found: [${lon}, ${lat}]`);
        return false;
    }
    return true;
}

module.exports = async (req, res) => {
    try {
        const collection = await connectToMongo();
        
        // Fetch all routes from the MongoDB collection
        const routes = await collection.find({}).toArray();

        // Format the routes and convert $numberDouble/$numberInt into regular numbers
        const formattedRoutes = routes.map(route => {
            // Fix coordinates for each feature and validate them
            route.geojson.features.forEach(feature => {
                feature.geometry.coordinates = feature.geometry.coordinates.map(coordPair => {
                    const formattedCoord = coordPair.map(coord => {
                        if (typeof coord === 'object' && coord.$numberDouble) {
                            return parseFloat(coord.$numberDouble);
                        } else if (typeof coord === 'object' && coord.$numberInt) {
                            return parseInt(coord.$numberInt);
                        }
                        return coord;  // Return if it's already a plain number
                    });

                    // Validate the coordinate pair
                    if (validateCoordinates(formattedCoord)) {
                        return formattedCoord;
                    } else {
                        // If invalid, return an empty array or handle as needed
                        return null;
                    }
                }).filter(coord => coord !== null);  // Filter out invalid coordinates
            });
    
            return {
                routeId: route._id.toString(),
                geojson: route.geojson,  // Properly formatted GeoJSON
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
