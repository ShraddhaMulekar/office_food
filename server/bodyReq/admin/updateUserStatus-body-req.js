const { body } = require("express-validator");

const updateUserStatusBodyReq = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
]
module.exports = { updateUserStatusBodyReq };