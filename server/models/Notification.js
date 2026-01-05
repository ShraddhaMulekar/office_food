const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'order_placed',
      'order_confirmed',
      'order_preparing',
      'order_ready',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled',
      'payment_success',
      'payment_failed',
      'payment_refunded',
      'delivery_assigned',
      'system_announcement',
      'menu_update',
      'promotion'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    orderNumber: String,
    amount: Number,
    dishName: String,
    deliveryTime: Date,
    floor: String,
    deskNumber: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  sentChannels: {
    inApp: {
      type: Boolean,
      default: false
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function(channel) {
  if (this.sentChannels[channel] !== undefined) {
    this.sentChannels[channel] = true;
  }
  this.sentAt = new Date();
  return this.save();
};

// Static method to create order notification
notificationSchema.statics.createOrderNotification = function(userId, orderId, orderNumber, type, additionalData = {}) {
  const notificationTemplates = {
    order_placed: {
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} has been placed successfully. We'll notify you when it's ready.`
    },
    order_confirmed: {
      title: 'Order Confirmed',
      message: `Your order #${orderNumber} has been confirmed and is being prepared.`
    },
    order_preparing: {
      title: 'Order Being Prepared',
      message: `Your order #${orderNumber} is being prepared in the kitchen.`
    },
    order_ready: {
      title: 'Order Ready for Delivery',
      message: `Your order #${orderNumber} is ready and will be delivered shortly.`
    },
    order_out_for_delivery: {
      title: 'Order Out for Delivery',
      message: `Your order #${orderNumber} is out for delivery and will reach you soon.`
    },
    order_delivered: {
      title: 'Order Delivered',
      message: `Your order #${orderNumber} has been delivered. Enjoy your meal!`
    },
    order_cancelled: {
      title: 'Order Cancelled',
      message: `Your order #${orderNumber} has been cancelled.`
    }
  };

  const template = notificationTemplates[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  return this.create({
    recipient: userId,
    type,
    title: template.title,
    message: template.message,
    data: {
      orderId,
      orderNumber,
      ...additionalData
    },
    channels: {
      inApp: true,
      email: true,
      sms: false,
      push: true
    }
  });
};

// Static method to create payment notification
notificationSchema.statics.createPaymentNotification = function(userId, orderNumber, type, amount) {
  const notificationTemplates = {
    payment_success: {
      title: 'Payment Successful',
      message: `Payment of ₹${amount} for order #${orderNumber} has been processed successfully.`
    },
    payment_failed: {
      title: 'Payment Failed',
      message: `Payment for order #${orderNumber} has failed. Please try again.`
    },
    payment_refunded: {
      title: 'Payment Refunded',
      message: `Payment of ₹${amount} for order #${orderNumber} has been refunded.`
    }
  };

  const template = notificationTemplates[type];
  if (!template) {
    throw new Error(`Unknown payment notification type: ${type}`);
  }

  return this.create({
    recipient: userId,
    type,
    title: template.title,
    message: template.message,
    data: {
      orderNumber,
      amount
    },
    channels: {
      inApp: true,
      email: true,
      sms: false,
      push: true
    }
  });
};

// Static method to create delivery assignment notification
notificationSchema.statics.createDeliveryNotification = function(deliveryStaffId, orderNumber, userDetails) {
  return this.create({
    recipient: deliveryStaffId,
    type: 'delivery_assigned',
    title: 'New Delivery Assignment',
    message: `You have been assigned order #${orderNumber} for delivery to ${userDetails.name} (Floor: ${userDetails.floor}, Desk: ${userDetails.deskNumber}).`,
    data: {
      orderNumber,
      floor: userDetails.floor,
      deskNumber: userDetails.deskNumber
    },
    channels: {
      inApp: true,
      email: false,
      sms: true,
      push: true
    },
    priority: 'high'
  });
};

// Static method to get unread notifications for user
notificationSchema.statics.getUnreadNotifications = function(userId, limit = 20) {
  return this.find({
    recipient: userId,
    isRead: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('data.orderId', 'orderNumber status');
};

// Static method to get all notifications for user
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('data.orderId', 'orderNumber status');
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 