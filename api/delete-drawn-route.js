const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongo() {
    await client.connect();
    return client.db('roadApp').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    const segmentId = req.query.id; // Get the segment ID from the query parameters

    try {
        const collection = await connectToMongo();
        // Check if the segmentId is a valid ObjectId, otherwise treat it as a string
        const filter = ObjectId.isValid(segmentId) 
            ? { _id: new ObjectId(segmentId) } 
            : { _id: segmentId };

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
