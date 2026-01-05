const { body } = require("express-validator");

const broadcastBodyReq = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required'),
  body('type').optional().isIn(['system_announcement', 'promotion']).withMessage('Invalid notification type'),
  body('recipients').optional().isIn(['all', 'employees', 'delivery']).withMessage('Invalid recipients')
]
module.exports = { broadcastBodyReq };