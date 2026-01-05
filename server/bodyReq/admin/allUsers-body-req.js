const { query } = require("express-validator");

const allUsersBodyReq = [
  query('role').optional().isIn(['employee', 'delivery', 'admin']),
  query('isActive').optional().isBoolean(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
]
module.exports = { allUsersBodyReq };