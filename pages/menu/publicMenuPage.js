const { validationResult } = require('express-validator');
const Menu = require('../../models/Menu');

const publicMenuPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      category,
      vegetarian,
      spicy,
      featured,
      search,
      sort = 'name',
      page = 1,
      limit = 20
    } = req.query;

    let query = { isAvailable: true };

    if (category) query.category = category;
    if (vegetarian !== undefined) query.isVegetarian = vegetarian === 'true';
    if (spicy !== undefined) query.isSpicy = spicy === 'true';
    if (featured !== undefined) query.featured = featured === 'true';

    if (search) {
      query.$text = { $search: search };
    }

    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { 'rating.average': -1 };
        break;
      case 'name':
      default:
        sortObj = { name: 1 };
        break;
    }

    if (sort === 'name') {
      sortObj = { featured: -1, name: 1 };
    }

    const skip = (page - 1) * limit;

    const dishes = await Menu.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');

    const total = await Menu.countDocuments(query);

    res.json({
      success: true,
      data: {
        dishes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu'
    });
  }
}

module.exports = publicMenuPage;