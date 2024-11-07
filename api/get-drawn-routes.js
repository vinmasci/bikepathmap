const { MongoClient } = require('mongodb');
require('dotenv').config();

let client;

async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI_DRAWN, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
    }
    return client.db('drawnRoutes').collection('drawnRoutes');  // Update to the correct database and collection
}

module.exports = async (req, res) => {
    try {
        const collection = await connectToMongo();
        const routes = await collection.find({}).toArray();

        console.log("Raw routes from MongoDB:", JSON.stringify(routes, null, 2));

        const formattedRoutes = routes.map(route => {
            const formattedFeatures = route.geojson.features.map(feature => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    title: feature.properties.title || "Untitled Route",
                    color: feature.properties.color || "#000000",
                    lineStyle: feature.properties.lineStyle || "solid",
                    routeId: route._id.toString()
                }
            }));

            return {
                routeId: route._id.toString(),
                geojson: {
                    type: "FeatureCollection",
                    features: formattedFeatures
                },
                gravelType: route.gravelType
            };
        });

        console.log("Formatted routes being sent:", JSON.stringify(formattedRoutes, null, 2));
        res.status(200).json({ routes: formattedRoutes });
    } catch (error) {
        console.error('Error retrieving routes:', error);
        res.status(500).json({ error: 'Failed to retrieve routes' });
    }
};
