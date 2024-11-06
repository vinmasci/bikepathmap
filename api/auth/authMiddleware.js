// authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.error("Token not provided");
        return res.status(401).json({ error: "Token not provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return res.status(403).json({ error: "Token verification failed" });
        }
        console.log("Token successfully verified:", decodedToken);
        req.user = { id: decodedToken.id };  // Set decoded ID to req.user
        next();
    });
};

module.exports = authenticateJWT;
