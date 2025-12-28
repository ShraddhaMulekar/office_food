const { body } = require("express-validator");

const profileBodyReq = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot exceed 50 characters'),
  body('floor')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Floor cannot exceed 20 characters'),
  body('deskNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Desk number cannot exceed 20 characters')
]

module.exports = { profileBodyReq };