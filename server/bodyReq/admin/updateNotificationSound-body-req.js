const { body } = require("express-validator");

const updateNotificationSoundBodyReq = [
  body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean'),
  body('type').optional().isIn(['beep', 'chime', 'ding', 'notification', 'alert', 'siren', 'bell', 'alarm']).withMessage('Invalid sound type')
]
module.exports = { updateNotificationSoundBodyReq };