const { query } = require("express-validator");

const orderBodyReq = [
  query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
  query('paymentStatus').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
]
module.exports = { orderBodyReq };