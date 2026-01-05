const { query } = require("express-validator");

const allMenuBodyReq = [
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts']).withMessage('Invalid category'),
  query('availability').optional().isIn(['all', 'available', 'unavailable']).withMessage('Invalid availability filter'),
  query('sort').optional().isIn(['name', 'price', 'createdAt', 'popularity']).withMessage('Invalid sort option'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
]
module.exports = { allMenuBodyReq };