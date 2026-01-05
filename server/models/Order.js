const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 200
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'cod', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    upiId: String,
    paymentTime: Date,
    refundTime: Date,
    refundReason: String
  },
  deliveryDetails: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  deliveryStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedDeliveryTime: {
    type: Date,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  rating: {
    stars: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 500
    },
    ratedAt: {
      type: Date,
      default: null
    }
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 200
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  paymentProof: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ deliveryStaff: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of orders today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const orderCount = await this.constructor.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    const sequence = (orderCount + 1).toString().padStart(3, '0');
    this.orderNumber = `OF${year}${month}${day}${sequence}`;
  }
  next();
});

// Method to calculate total amount
orderSchema.methods.calculateTotal = function() {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.finalAmount = this.totalAmount + this.tax - this.discount;
  return this.finalAmount;
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, updatedBy = null) {
  this.status = newStatus;
  
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancelledBy = updatedBy || 'system';
  } else if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Method to assign delivery staff
orderSchema.methods.assignDeliveryStaff = function(deliveryStaffId) {
  this.deliveryStaff = deliveryStaffId;
  return this.save();
};

// Method to add rating
orderSchema.methods.addRating = function(stars, feedback = '') {
  this.rating = {
    stars,
    feedback,
    ratedAt: new Date()
  };
  return this.save();
};

// Method to process refund
orderSchema.methods.processRefund = function(reason) {
  this.paymentStatus = 'refunded';
  this.status = 'refunded';
  this.paymentDetails.refundTime = new Date();
  this.paymentDetails.refundReason = reason;
  return this.save();
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status }).populate('user', 'name email phone').populate('deliveryStaff', 'name phone');
};

// Static method to get user orders
orderSchema.statics.getUserOrders = function(userId) {
  return this.find({ user: userId })
    .populate('items.dish', 'name image')
    .populate('deliveryStaff', 'name phone')
    .sort({ createdAt: -1 });
};

// Static method to get delivery staff orders
orderSchema.statics.getDeliveryStaffOrders = function(deliveryStaffId) {
  return this.find({ deliveryStaff: deliveryStaffId })
    .populate('user', 'name phone floor deskNumber')
    .populate('items.dish', 'name image')
    .sort({ createdAt: -1 });
};

// Static method to get orders for admin dashboard
orderSchema.statics.getAdminOrders = function(filters = {}) {
  let query = {};
  
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.dateFrom) {
    query.createdAt = { $gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    if (query.createdAt) {
      query.createdAt.$lte = new Date(filters.dateTo);
    } else {
      query.createdAt = { $lte: new Date(filters.dateTo) };
    }
  }
  
  return this.find(query)
    .populate('user', 'name email phone')
    .populate('deliveryStaff', 'name phone')
    .populate('items.dish', 'name image')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema); 