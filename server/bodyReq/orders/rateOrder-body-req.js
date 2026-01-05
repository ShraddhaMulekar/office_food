const { body } = require("express-validator");

const rateOrderBodyReq = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString().isLength({ max: 500 })
]
module.exports = { rateOrderBodyReq };