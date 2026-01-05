const { body } = require("express-validator");

const availabilityBodyReq = [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
  body('currentLocation').optional().isString().isLength({ max: 100 })
]
module.exports = { availabilityBodyReq };