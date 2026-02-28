const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './env' });

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Decode JWT token
function decodeToken(token) {
  return jwt.decode(token);
}

// Extract token from header
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);  // remove 'Bearer ' prefix
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader
};