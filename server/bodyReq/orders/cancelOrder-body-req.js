const { body } = require("express-validator");

const cancelOrderBodyReq = [
  body('reason').optional().isString().isLength({ max: 200 })
]
module.exports = { cancelOrderBodyReq };