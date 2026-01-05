const { body } = require("express-validator");

const refundBodyReq = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('amount').isFloat({ min: 0 }).withMessage('Invalid refund amount'),
  body('reason').isString().withMessage('Refund reason is required')
]
module.exports = refundBodyReq;