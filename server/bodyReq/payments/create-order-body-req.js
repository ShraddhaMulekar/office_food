const { body } = require("express-validator");

const createOrderBodyReq = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('paymentMethod').isIn(['upi', 'qr_code', 'card', 'netbanking']).withMessage('Invalid payment method')
]

module.exports = { createOrderBodyReq };