const { query } = require("express-validator");

const paymentsBodyReq = [
  query('search').optional().isString().withMessage('Search must be a string'),
  query('paymentStatus').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status'),
  query('paymentMethod').optional().isIn(['upi', 'cod', 'card']).withMessage('Invalid payment method'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
]
module.exports = { paymentsBodyReq };