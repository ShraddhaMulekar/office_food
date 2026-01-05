const { query } = require("express-validator");

const revenueBodyReq = [
  query('period').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
]
module.exports = { revenueBodyReq };