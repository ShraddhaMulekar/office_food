const { validationResult } = require("express-validator");

const updateUserNotificationPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId, orderNumber } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const io = req.app.get('io');
    if (io) {
      console.log('Test user notification: Emitting to user room:', `user-${userId}`);
      
      // Emit test order update
      io.to(`user-${userId}`).emit('orderUpdate', {
        type: 'confirmed',
        order: {
          _id: 'test-order-id',
          orderNumber: orderNumber,
          user: { name: user.name },
          status: 'confirmed'
        }
      });
      
      // Log user room clients
      const userRoom = io.sockets.adapter.rooms.get(`user-${userId}`);
      console.log('Test user notification: User room clients:', userRoom ? userRoom.size : 0);
      
      res.json({
        success: true,
        message: 'Test notification sent',
        userRoomClients: userRoom ? userRoom.size : 0,
        userId: userId,
        orderNumber: orderNumber
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Socket.io not available'
      });
    }
  } catch (error) {
    console.error('Test user notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test notification'
    });
  }
}
module.exports = { updateUserNotificationPage };