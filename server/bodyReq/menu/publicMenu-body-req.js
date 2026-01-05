const { query } = require("express-validator");

const publicMenuBodyReq = [
  query('category').optional().isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts']),
  query('vegetarian').optional().isBoolean(),
  query('spicy').optional().isBoolean(),
  query('featured').optional().isBoolean(),
  query('search').optional().isString(),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'rating', 'name']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
]
module.exports = { publicMenuBodyReq };