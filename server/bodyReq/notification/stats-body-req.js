const { query } = require("express-validator");

const statsBodyReq = [
  query('period').optional().isIn(['today', 'week', 'month']).withMessage('Invalid period')
]
module.exports = { statsBodyReq };