const express = require('express');
const { body } = require('express-validator');
const budgetController = require('../controllers/budgetController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

const budgetValidation = [
  body('categoryId')
    .isInt()
    .withMessage('Category ID must be an integer'),
  body('limitAmount')
    .isNumeric()
    .withMessage('Limit amount must be a numeric value')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Limit amount must be greater than 0'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

const budgetUpdateValidation = [
  body('limitAmount')
    .isNumeric()
    .withMessage('Limit amount must be a numeric value')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Limit amount must be greater than 0'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Apply Auth Guard
router.use(authenticateJWT);

router.get('/', budgetController.getAll);
router.post('/', validate(budgetValidation), budgetController.create);
router.put('/:id', validate(budgetUpdateValidation), budgetController.update);
router.delete('/:id', budgetController.remove);

module.exports = router;
