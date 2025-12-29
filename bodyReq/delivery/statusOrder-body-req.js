const { query } = require("express-validator");

const statusOrderBodyReq = [
  query('period').optional().isIn(['today', 'week', 'month']).withMessage('Invalid period')
]

module.exports = { statusOrderBodyReq };