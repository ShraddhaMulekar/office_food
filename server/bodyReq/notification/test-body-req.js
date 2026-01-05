const { body } = require("express-validator");

const testBodyReq = [
  body('type').isIn(['email', 'sms', 'push']).withMessage('Invalid notification type')
]
module.exports = { testBodyReq };