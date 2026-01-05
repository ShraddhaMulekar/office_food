const { body } = require('express-validator');

const updateOrderStatusBodyReq = [
  body('status').isIn(['pending', 'confirmed', 'delivering', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().isLength({ max: 500 }),
  body('deliveryAgentId').optional().custom((value) => {
    if (value && value !== '') {
      // Only validate if a value is provided and it's not empty
      const mongoose = require('mongoose');
      return mongoose.Types.ObjectId.isValid(value);
    }
    return true;
  }).withMessage('Invalid delivery agent ID')
]
module.exports = { updateOrderStatusBodyReq };