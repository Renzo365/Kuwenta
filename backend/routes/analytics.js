const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth protection globally
router.use(authenticateJWT);

router.get('/summary', analyticsController.getSummary);
router.get('/categories', analyticsController.getCategoryBreakdown);
router.get('/trends', analyticsController.getMonthlyTrends);

module.exports = router;
