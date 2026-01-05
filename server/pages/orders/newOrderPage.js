const { validationResult } = require("express-validator");

const newOrderPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { items, paymentMethod, deliveryDetails } = req.body;

    // Validate and get dish details
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const dish = await Menu.findById(item.dishId);
      if (!dish) {
        return res.status(400).json({
          success: false,
          message: `Dish with ID ${item.dishId} not found`
        });
      }

      if (!dish.isAvailableForOrder()) {
        return res.status(400).json({
          success: false,
          message: `Dish "${dish.name}" is not available for ordering`
        });
      }

      const itemTotal = dish.discountedPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        dish: dish._id,
        name: dish.name,
        price: dish.discountedPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
        specialInstructions: item.specialInstructions || ''
      });

      // Increment sold count
      await dish.incrementSoldCount(item.quantity);
    }

    // Calculate final amount (no tax)
    const tax = 0;
    const finalAmount = totalAmount;

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of orders today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const orderCount = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    const sequence = (orderCount + 1).toString().padStart(3, '0');
    const orderNumber = `OF${year}${month}${day}${sequence}`;

    // Create order
    const order = new Order({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      tax,
      finalAmount,
      paymentMethod,
      deliveryDetails: {
        address: deliveryDetails.address,
        specialInstructions: deliveryDetails.specialInstructions || ''
      },
      preparationTime: Math.max(...orderItems.map(item => {
        const dish = items.find(i => i.dishId === item.dish.toString());
        return dish ? dish.preparationTime || 15 : 15;
      }))
    });

    await order.save();

    // Populate order with user and dish details
    await order.populate('user', 'name email phone');
    await order.populate('items.dish', 'name image');

    // Create notification for user
    await Notification.createOrderNotification(
      req.user._id,
      order._id,
      order.orderNumber,
      'order_placed'
    );

    // Create admin notification for all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    const adminNotifications = admins.map(admin => ({
      recipient: admin._id,
      type: 'order_placed',
      title: 'New Order Received',
      message: `New order #${order.orderNumber} from ${order.user.name}`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.finalAmount,
        floor: order.deliveryDetails?.floor,
        deskNumber: order.deliveryDetails?.deskNumber,
        userName: order.user.name,
        userEmail: order.user.email
      },
      priority: 'high',
      channels: {
        inApp: true,
        email: false,
        sms: false,
        push: false
      }
    }));

    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    // Emit real-time notification
    const io = req.app.get('io');
    console.log('Orders route: Emitting orderUpdate to user:', req.user._id);
    io.to(`user-${req.user._id}`).emit('orderUpdate', {
      type: 'order_placed',
      order: order
    });

    // Notify admin
    console.log('Orders route: Emitting newOrder to admin-room');
    io.to('admin-room').emit('newOrder', {
      order: order
    });
    
    // Log admin room clients
    const adminRoom = io.sockets.adapter.rooms.get('admin-room');
    console.log('Orders route: Admin room clients:', adminRoom ? adminRoom.size : 0);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while placing order'
    });
  }
}
module.exports = { newOrderPage };