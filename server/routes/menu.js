const express = require('express');
const multer = require('multer');
const Menu = require('../models/Menu');
const { protect, isAdmin } = require('../middleware/auth');
const { storageMulter } = require('../multer/menu/storageMulter');
const { uploadMulter } = require('../multer/menu/uploadMulter');
const { publicMenuBodyReq } = require('../bodyReq/menu/publicMenu-body-req');
const publicMenuPage = require('../pages/menu/publicMenuPage');
const { singleMenuPage } = require('../pages/menu/singleMenuPage');
const { createDishBodyReq } = require('../bodyReq/menu/createDish-body-req');
const { createDishPage } = require('../pages/menu/createDishPage');
const updateDishPage = require('../pages/menu/updateDishPage');
const deleteDishPage = require('../pages/menu/deleteDishPage');

const router = express.Router();

// Configure multer for file uploads
const storage = storageMulter;

const upload = uploadMulter;

// @route   GET /api/menu
// @desc    Get all available dishes
// @access  Public
router.get('/', publicMenuBodyReq, publicMenuPage);

// @route   GET /api/menu/:id
// @desc    Get single dish by ID
// @access  Public
router.get('/:id', singleMenuPage);

// @route   POST /api/menu
// @desc    Create a new dish (Admin only)
// @access  Private/Admin
router.post('/', protect, isAdmin, upload.single('image'), createDishBodyReq, createDishPage);

// @route   PUT /api/menu/:id
// @desc    Update a dish (Admin only)
// @access  Private/Admin
router.put('/:id', protect, isAdmin, upload.single('image'), updateDishPage);

// @route   DELETE /api/menu/:id
// @desc    Delete a dish (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, deleteDishPage);

module.exports = router; 