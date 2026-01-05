const { body } = require("express-validator");

const newUserBodyReq = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body ('role').isIn(['admin', 'delivery']).withMessage('Role must be admin or delivery'),
]
module.exports = { newUserBodyReq };