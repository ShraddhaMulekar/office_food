const { body } = require("express-validator");

const forgotPasswordBodyReq = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

module.exports = { forgotPasswordBodyReq };