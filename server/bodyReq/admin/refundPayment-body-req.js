const { body } = require("express-validator");

const refundPaymentBodyReq = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Invalid refund amount'),
  body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('Refund reason is required')
]
module.exports = { refundPaymentBodyReq };