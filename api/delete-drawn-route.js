const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

let client;

async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI_DRAWN, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
    }
    return client.db('drawnRoutes').collection('drawnRoutes'); // Update to the correct database and collection
}

module.exports = async (req, res) => {
    const routeId = req.query.routeId;

    if (!routeId) {
        return res.status(400).json({ success: false, message: "No route ID provided." });
    }

    try {
        const collection = await connectToMongo();
        const filter = { _id: new ObjectId(routeId) };

        console.log("Attempting to delete with filter:", filter);
        const result = await collection.deleteOne(filter);

        if (result.deletedCount === 1) {
            res.status(200).json({ success: true, message: 'Segment deleted successfully!' });
        } else {
            res.status(404).json({ success: false, message: 'Segment not found.' });
        }
    } catch (error) {
        console.error('Error deleting segment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete segment.' });
    }
};
