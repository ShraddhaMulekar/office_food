const { query } = require("express-validator");

const notificationBodyReq = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('unreadOnly').optional().isBoolean()
]
module.exports = { notificationBodyReq };