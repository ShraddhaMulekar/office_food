const testNotificationPage = async (req, res) => {
  try {
    const io = req.app.get('io');
    
    // Log admin room clients
    const adminRoom = io.sockets.adapter.rooms.get('admin-room');
    console.log('Test notification: Admin room clients:', adminRoom ? adminRoom.size : 0);
    
    // Emit test notification
    io.to('admin-room').emit('newOrder', {
      order: {
        _id: 'test-order-id',
        orderNumber: 'TEST123',
        user: { name: 'Test User' },
        deliveryDetails: { floor: '1', deskNumber: 'A1' },
        finalAmount: 100,
        items: [{ name: 'Test Item', quantity: 1 }]
      }
    });
    
    console.log('Test notification: Emitted test notification to admin-room');
    
    res.json({
      success: true,
      message: 'Test notification sent',
      adminRoomClients: adminRoom ? adminRoom.size : 0
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test notification'
    });
  }
}
module.exports = { testNotificationPage };