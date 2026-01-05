const { body } = require("express-validator");

const updateUserBodyReq = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10}$/),
  body('role').optional().isIn(['employee', 'delivery', 'admin']),
  body('isActive').optional().isBoolean(),
  body('department').optional().trim().isLength({ max: 50 }),
  body('floor').optional().trim().isLength({ max: 20 }),
  body('deskNumber').optional().trim().isLength({ max: 20 }),
  body('isAvailable').optional().isBoolean()
]
module.exports = { updateUserBodyReq };