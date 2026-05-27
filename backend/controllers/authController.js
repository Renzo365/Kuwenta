const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'kuwenta_local_development_jwt_refresh_secret_token_456789!';

// Register a new user
async function register(req, res) {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user or email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already registered'
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert user
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. You can now log in.',
      data: {
        id: result.insertId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.'
    });
  }
}

// Log in an existing user
async function login(req, res) {
  const { email, password } = req.body;

  try {
    // 1. Fetch user by email
    const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Set Refresh Token in HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // 5. Send access token and user info
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          currency: user.currency,
          theme: user.theme
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
}

// Refresh access token using refresh token cookie
async function refresh(req, res) {
  // Extract refresh token from cookies
  const cookies = req.headers.cookie;
  let refreshToken = null;

  if (cookies) {
    const cookieMap = {};
    cookies.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookieMap[parts[0].trim()] = parts[1].trim();
    });
    refreshToken = cookieMap['refreshToken'];
  }

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Refresh token missing.'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Fetch fresh user record
    const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    const user = users[0];

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          currency: user.currency,
          theme: user.theme
        }
      }
    });
  } catch (error) {
    console.error('Refresh token validation error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token.'
    });
  }
}

// Log out a user by clearing refresh cookie
async function logout(req, res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

// Get current user profile details
async function getMe(req, res) {
  try {
    const users = await query(
      'SELECT id, username, email, currency, theme, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get profile details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile details.'
    });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe
};
