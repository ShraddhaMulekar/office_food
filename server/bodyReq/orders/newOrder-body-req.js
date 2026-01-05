const { body } = require("express-validator");

const newOrderBodyReq = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.dishId').isMongoId().withMessage('Invalid dish ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.specialInstructions').optional().isString().isLength({ max: 200 }),
  body('paymentMethod').isIn(['upi', 'cod', 'card']).withMessage('Invalid payment method'),
  body('deliveryDetails.address').notEmpty().withMessage('Address is required'),
  body('deliveryDetails.specialInstructions').optional().isString().isLength({ max: 200 })
]
module.exports = { newOrderBodyReq };