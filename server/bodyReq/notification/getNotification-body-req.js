const { query } = require("express-validator");

const getNotificationBodyReq = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('unread').optional().isBoolean()
]
module.exports = { getNotificationBodyReq };