const verifyToken = require('./verifyToken');

export default function handler(req, res) {
    verifyToken(req, res, () => {
        res.json({
            user: req.user,  // Access `req.user`, which contains the decoded JWT payload
        });
    });
}
