const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getNotificationBodyReq } = require('../bodyReq/notification/getNotification-body-req');
const getNotificationPage = require('../pages/notification/getNotificationPage');
const unreadNotificationPage = require('../pages/notification/unreadNotificationPage');
const updateSingleNotificationPage = require('../pages/notification/updateSingleNotificationPage');
const updateAllNotificationPage = require('../pages/notification/updateAllNotificationPage');
const deleteNotificationPage = require('../pages/notification/deleteNotificationPage');
const deleteSingleNotificationPage = require('../pages/notification/deleteSingleNotificationPage');
const preferencePage = require('../pages/notification/preferencePage');
const { updatePreferenceBodyReq } = require('../bodyReq/notification/updatePreference-body-req');
const { updatePreferencePage } = require('../pages/notification/updatePreferencePage');
const { testBodyReq } = require('../bodyReq/notification/test-body-req');
const { testPage } = require('../pages/notification/testPage');
const { statsBodyReq } = require('../bodyReq/notification/stats-body-req');
const { statsPage } = require('../pages/notification/statsPage');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, getNotificationBodyReq, getNotificationPage);

// @route   GET /api/notifications/unread
// @desc    Get unread notifications count
// @access  Private
router.get('/unread', protect, unreadNotificationPage);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, updateSingleNotificationPage);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, updateAllNotificationPage);

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all user notifications
// @access  Private
router.delete('/clear-all', protect, deleteNotificationPage);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, deleteSingleNotificationPage);

// @route   GET /api/notifications/preferences
// @desc    Get user notification preferences
// @access  Private
router.get('/preferences', protect, preferencePage);

// @route   PUT /api/notifications/preferences
// @desc    Update user notification preferences
// @access  Private
router.put('/preferences', protect, updatePreferenceBodyReq, updatePreferencePage);

// @route   POST /api/notifications/test
// @desc    Send test notification to user
// @access  Private
router.post('/test', protect, testBodyReq, testPage);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics for user
// @access  Private
router.get('/stats', protect, statsBodyReq, statsPage);

module.exports = router; 