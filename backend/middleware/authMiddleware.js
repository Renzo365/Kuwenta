const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'kuwenta_local_development_jwt_access_secret_token_123987!';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'kuwenta_local_development_jwt_refresh_secret_token_456789!';

// Middleware to authenticate requests via Bearer token
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded; // Attach user context (id, username, email)
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid access token.'
    });
  }
}

// Generate Access Token (short-lived: 15 mins)
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
}

// Generate Refresh Token (long-lived: 7 days)
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  authenticateJWT,
  generateAccessToken,
  generateRefreshToken
};
