const express = require('express');
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation schema rules for transaction payloads
const transactionValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a numeric value')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Amount must be greater than 0'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage("Type must be either 'income' or 'expense'"),
  body('categoryId')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Category ID must be an integer'),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  body('transactionDate')
    .isISO8601()
    .withMessage('Date must be in valid format (YYYY-MM-DD)'),
  body('paymentMethod')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Payment method text cannot exceed 50 characters')
];

// Mount authentication middleware globally across all transaction routes
router.use(authenticateJWT);

// Routes mapping configuration
router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.post('/', validate(transactionValidation), transactionController.create);
router.put('/:id', validate(transactionValidation), transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
