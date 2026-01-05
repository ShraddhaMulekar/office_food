const { body } = require("express-validator");

const updateUserNotificationBodyReq = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('orderNumber').isString().withMessage('Order number is required')
]
module.exports = { updateUserNotificationBodyReq };