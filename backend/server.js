const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const initializeDatabase = require('./config/initDb');
const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable security headers
app.use(helmet());

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const savingsRoutes = require('./routes/savings');
const analyticsRoutes = require('./routes/analytics');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/savings', savingsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  try {
    // Verify database connection pool is active
    const connection = await pool.getConnection();
    connection.release();
    
    return res.status(200).json({
      success: true,
      message: 'Kuwenta API is healthy and connected to database.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Kuwenta API is running but database is offline.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred.' 
      : err.message
  });
});

// Initialize database schema and start server
async function startServer() {
  try {
    // Run database bootstrapping
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error('Failed to start server due to database initialization failure:', error.message);
    process.exit(1);
  }
}

startServer();
