const { body } = require("express-validator");

const passwordBodyReq = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

module.exports = {
  passwordBodyReq,
}; 