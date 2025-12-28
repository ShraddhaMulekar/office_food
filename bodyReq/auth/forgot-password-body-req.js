const { body } = require("express-validator");

const forgotPasswordBodyReq = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
]
module.exports = { forgotPasswordBodyReq };