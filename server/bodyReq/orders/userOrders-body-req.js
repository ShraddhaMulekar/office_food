const { query } = require("express-validator");

const userOrdersBodyReq = [
  query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
]
module.exports = { userOrdersBodyReq };