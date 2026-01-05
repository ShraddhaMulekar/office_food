const { body } = require("express-validator");

const createDishBodyReq = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 500 }),
  body('price').isFloat({ min: 0 }),
  body('category').isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'])
]
module.exports = { createDishBodyReq };