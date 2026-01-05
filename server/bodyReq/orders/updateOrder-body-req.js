const { body } = require("express-validator");

const updateOrderBodyReq = [
  body('status').isIn(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
  body('notes').optional().isString().isLength({ max: 500 })
]
module.exports = { updateOrderBodyReq };