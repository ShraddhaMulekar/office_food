const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, isAdmin } = require('../middleware/auth');
const {profilePage} = require('../pages/users/profilePage');
const updateProfileBodyReq = require('../bodyReq/users/updateProfile-body-req');
const updateProfilePage = require('../pages/users/updateProfilePage');
const { ordersBodyReq } = require('../bodyReq/users/orders-body-req');
const { orderPage } = require('../pages/users/ordersPage');
const { singleOrderPage } = require('../pages/users/singleOrderPage');
const { statPage } = require('../pages/users/statsPage');
const { deliveryStaffPage } = require('../pages/users/deliveryStaffPage');
const { employeesBodyReq } = require('../bodyReq/users/employees-body-req');
const employeesPage = require('../pages/users/employeesPage');
const { checkEmailBodyReq } = require('../bodyReq/users/checkEmail-body-req');
const { checkEmailPage } = require('../pages/users/checkEmailPage');
const { departmentsPage } = require('../pages/users/departmentsPage');
const { floorPage } = require('../pages/users/floorsPage');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, profilePage);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfileBodyReq, updateProfilePage);

// @route   GET /api/users/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', protect, ordersBodyReq, orderPage);

// @route   GET /api/users/orders/:id
// @desc    Get specific user order
// @access  Private
router.get('/orders/:id', protect, singleOrderPage);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, statPage);

// @route   GET /api/users/delivery-staff
// @desc    Get available delivery staff (Admin only)
// @access  Private/Admin
router.get('/delivery-staff', protect, isAdmin, deliveryStaffPage);

// @route   GET /api/users/employees
// @desc    Get all employees (Admin only)
// @access  Private/Admin
router.get('/employees', protect, isAdmin, employeesBodyReq, employeesPage);

// @route   POST /api/users/check-email
// @desc    Check if email exists
// @access  Public
router.post('/check-email', checkEmailBodyReq, checkEmailPage);

// @route   GET /api/users/departments
// @desc    Get all departments
// @access  Private
router.get('/departments', protect, departmentsPage);

// @route   GET /api/users/floors
// @desc    Get all floors
// @access  Private
router.get('/floors', protect, floorPage);

module.exports = router; 