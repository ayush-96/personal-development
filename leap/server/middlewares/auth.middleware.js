const jwtUtil = require('../utils/jwt');
const response = require('../utils/response');

exports.verifyToken = (req, res, next) => {
    const token = jwtUtil.extractTokenFromHeader(req);

    if (!token) {
        return res.status(401).json(response.error('Missing or invalid token', 2001));
    }

    try {
        const decoded = jwtUtil.verifyToken(token);
        req.user = decoded;     // put the parsed user info into req.user
        next();
    } catch (err) {
        const message = err.message || 'Missing or invalid token';
        return res.status(401).json(response.error(message, 2001));
    }
};  