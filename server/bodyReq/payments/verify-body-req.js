const { body } = require("express-validator");

const verifyBodyReq = [
  body('razorpayOrderId').isString().withMessage('Razorpay order ID is required'),
  body('razorpayPaymentId').isString().withMessage('Razorpay payment ID is required'),
  body('razorpaySignature').isString().withMessage('Razorpay signature is required'),
  body('orderId').isMongoId().withMessage('Order ID is required')
]
module.exports = { verifyBodyReq };