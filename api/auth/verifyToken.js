const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];  // Get token from `Authorization` header

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        req.user = decoded;  // Attach decoded token to the request
        next();  // Continue to the next middleware/route handler
    });
}

module.exports = verifyToken;
