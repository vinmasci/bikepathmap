const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongo() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    return client.db('roadApp').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    try {
        const collection = await connectToMongo();
        
        // Fetch all routes from the MongoDB collection
        const routes = await collection.find({}).toArray();

        // Log the raw routes before processing them
        console.log("Raw routes from MongoDB:", JSON.stringify(routes, null, 2));

        // Convert $numberDouble/$numberInt into regular numbers without altering existing color
        const formattedRoutes = routes.map(route => {
            // Fix coordinates for each feature
            route.geojson.features.forEach(feature => {
                feature.geometry.coordinates = feature.geometry.coordinates.map(coordPair => {
                    return coordPair.map(coord => {
                        if (typeof coord === 'object' && coord.$numberDouble) {
                            return parseFloat(coord.$numberDouble);
                        } else if (typeof coord === 'object' && coord.$numberInt) {
                            return parseInt(coord.$numberInt);
                        }
                        return coord;  // Return as is if it's already a plain number
                    });
                });

                // Preserve existing properties like color and lineStyle if they exist
                if (!feature.properties) {
                    feature.properties = {};
                }

                // Log original properties for debugging
                console.log("Original properties for feature:", feature.properties);

                // No changes to color or lineStyle properties if they already exist
                feature.properties.color = feature.properties.color || "#000000";  // Default color if not set
                feature.properties.lineStyle = feature.properties.lineStyle || "solid";  // Default line style if not set

                // Log the fixed coordinates after conversion
                console.log("Fixed coordinates after conversion:", feature.geometry.coordinates);
            });

            return {
                routeId: route._id.toString(),
                geojson: route.geojson,  // Return the formatted GeoJSON
                gravelType: route.gravelType  // Return the gravel type
            };
        });

        // Log the formatted routes before sending them to the client
        console.log("Formatted routes being sent:", JSON.stringify(formattedRoutes, null, 2));

        // Send the formatted routes to the client
        res.status(200).json({ routes: formattedRoutes });
    } catch (error) {
        console.error('Error retrieving routes:', error);
        res.status(500).json({ error: 'Failed to retrieve routes' });
    }
};
