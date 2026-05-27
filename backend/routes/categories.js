const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage("Type must be either 'income' or 'expense'"),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g. #FFFFFF)'),
  body('icon')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Icon identifier cannot exceed 50 characters')
];

// Secure endpoints
router.use(authenticateJWT);

router.get('/', categoryController.getAll);
router.post('/', validate(categoryValidation), categoryController.create);

module.exports = router;
