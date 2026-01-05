const { body } = require("express-validator");

const updateMenuBodyReq = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts']).withMessage('Invalid category'),
  body('isVegetarian').optional().isBoolean().withMessage('isVegetarian must be a boolean'),
  body('isSpicy').optional().isBoolean().withMessage('isSpicy must be a boolean'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  body('featured').optional().isBoolean().withMessage('featured must be a boolean'),
  body('image').optional().custom((value) => {
    if (value && typeof value === 'string') {
      // Accept URLs, file paths, or data URLs
      const urlPattern = /^(https?:\/\/|data:image\/|\/uploads\/)/;
      if (!urlPattern.test(value)) {
        throw new Error('Image must be a valid URL or file path');
      }
    }
    return true;
  }).withMessage('Image must be a valid URL or file path'),
  body('allergens').optional().isString().withMessage('Allergens must be a string')
]
module.exports = { updateMenuBodyReq };