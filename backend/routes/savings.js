const express = require('express');
const { body } = require('express-validator');
const savingsController = require('../controllers/savingsController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

const goalValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Savings goal name is required')
    .isLength({ max: 100 })
    .withMessage('Savings goal name cannot exceed 100 characters'),
  body('targetAmount')
    .isNumeric()
    .withMessage('Target amount must be a numeric value')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Target amount must be greater than 0'),
  body('currentAmount')
    .optional()
    .isNumeric()
    .withMessage('Current amount must be a numeric value')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Current amount must be 0 or greater'),
  body('targetDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Target date must be a valid date (YYYY-MM-DD)')
];

const adjustValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a numeric value')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Amount must be greater than 0'),
  body('action')
    .isIn(['deposit', 'withdraw'])
    .withMessage("Action must be either 'deposit' or 'withdraw'")
];

// Apply Auth Guard
router.use(authenticateJWT);

router.get('/', savingsController.getAll);
router.post('/', validate(goalValidation), savingsController.create);
router.put('/:id', validate(goalValidation), savingsController.update);
router.patch('/:id/deposit', validate(adjustValidation), savingsController.adjustBalance);
router.delete('/:id', savingsController.remove);

module.exports = router;
