const { query } = require("express-validator");

const assignedOrderBodyReq = [
  query('status').optional().isIn(['pending', 'confirmed', 'delivering', 'delivered']),
  query('paymentMethod').optional().isIn(['cod', 'upi', 'card']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
]
module.exports = { assignedOrderBodyReq };