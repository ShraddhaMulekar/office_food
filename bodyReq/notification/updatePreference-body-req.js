const { body } = require("express-validator");

const updatePreferenceBodyReq = [
  body('email').optional().isBoolean().withMessage('Email preference must be a boolean'),
  body('sms').optional().isBoolean().withMessage('SMS preference must be a boolean'),
  body('push').optional().isBoolean().withMessage('Push preference must be a boolean'),
  body('sound').optional().isObject().withMessage('Sound preferences must be an object')
]
module.exports = { updatePreferenceBodyReq };