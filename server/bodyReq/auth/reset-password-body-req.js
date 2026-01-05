const { body } = require("express-validator");

const resetPasswordBodyReq = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('newPassword')
    .trim()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

module.exports = { resetPasswordBodyReq };