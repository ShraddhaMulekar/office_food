const { body } = require("express-validator");

const updateStatusOrderBodyReq = [
  body('status').isIn(['delivering', 'delivered']).withMessage('Invalid status for delivery staff'),
  body('notes').optional().isString().isLength({ max: 500 })
]
module.exports = { updateStatusOrderBodyReq };