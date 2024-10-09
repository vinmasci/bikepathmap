const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongo() {
    await client.connect();
    return client.db('roadApp').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    try {
        const collection = await connectToMongo();
        const routes = await collection.find({}).toArray(); // Fetch all routes

        const formattedRoutes = routes.map(route => ({
            routeId: route._id.toString(),
            geojson: route.geojson
        }));

        res.status(200).json({ routes: formattedRoutes });
    } catch (error) {
        console.error('Error retrieving routes:', error);
        res.status(500).json({ error: 'Failed to retrieve routes' });
    }
};
