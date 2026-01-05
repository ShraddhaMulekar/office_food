const { query } = require("express-validator");

const employeesBodyReq = [
  query('search').optional().isString(),
  query('department').optional().isString(),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
]
module.exports = { employeesBodyReq };