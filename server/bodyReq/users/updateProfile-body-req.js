const { body } = require("express-validator");

const updateProfileBodyReq = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^[0-9]{10}$/),
  body('department').optional().trim().isLength({ max: 50 }),
  body('floor').optional().trim().isLength({ max: 20 }),
  body('deskNumber').optional().trim().isLength({ max: 20 })
]
module.exports = updateProfileBodyReq;