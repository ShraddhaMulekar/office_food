const { query } = require("express-validator");

const adminDashboardBodyReq = [
  query('period').optional().isIn(['today', 'week', 'month', 'year', 'all']).withMessage('Invalid period')
]
module.exports = { adminDashboardBodyReq };