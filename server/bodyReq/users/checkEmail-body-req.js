const { body } = require("express-validator");

const checkEmailBodyReq = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
]
module.exports = { checkEmailBodyReq };