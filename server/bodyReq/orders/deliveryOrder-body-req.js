const { body } = require("express-validator");

const deliveryOrderBodyReq = [
  body('deliveryStaffId').isMongoId().withMessage('Invalid delivery staff ID')
]
module.exports = { deliveryOrderBodyReq };