const { body } = require("express-validator");

const updateStaffProfileBodyReq = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^[0-9]{10}$/),
  body('currentLocation').optional().trim().isLength({ max: 100 })
]
module.exports = { updateStaffProfileBodyReq };