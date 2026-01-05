const { body } = require("express-validator");

const loginBodyReq = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

module.exports = { loginBodyReq };