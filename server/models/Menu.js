const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dish name is required'],
    trim: true,
    maxlength: [100, 'Dish name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'],
    default: 'lunch'
  },
  image: {
    type: String,
    required: [true, 'Dish image is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
    min: [1, 'Preparation time must be at least 1 minute']
  },
  calories: {
    type: Number,
    min: 0,
    default: 0
  },
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish', 'wheat']
  }],
  ingredients: [{
    type: String,
    trim: true
  }],
  nutritionalInfo: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }
  },
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  dailyLimit: {
    type: Number,
    default: null, // null means no limit
    min: 1
  },
  soldToday: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  discount: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    validUntil: {
      type: Date,
      default: null
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
menuSchema.index({ category: 1, isAvailable: 1 });
menuSchema.index({ isVegetarian: 1 });
menuSchema.index({ featured: 1 });
menuSchema.index({ 'rating.average': -1 });
menuSchema.index({ name: 'text', description: 'text' });

// Virtual for discounted price
menuSchema.virtual('discountedPrice').get(function() {
  if (this.discount.percentage > 0 && 
      (!this.discount.validUntil || this.discount.validUntil > new Date())) {
    return this.price - (this.price * this.discount.percentage / 100);
  }
  return this.price;
});

// Method to check if dish is available for ordering
menuSchema.methods.isAvailableForOrder = function() {
  if (!this.isAvailable) return false;
  
  if (this.dailyLimit && this.soldToday >= this.dailyLimit) {
    return false;
  }
  
  return true;
};

// Method to update rating
menuSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to increment sold count
menuSchema.methods.incrementSoldCount = function(quantity = 1) {
  this.soldToday += quantity;
  return this.save();
};

// Static method to reset daily sold counts (should be called daily)
menuSchema.statics.resetDailyCounts = function() {
  return this.updateMany({}, { soldToday: 0 });
};

// Static method to get available dishes
menuSchema.statics.getAvailableDishes = function(category = null) {
  let query = { isAvailable: true };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ featured: -1, 'rating.average': -1 });
};

// Ensure virtual fields are serialized
menuSchema.set('toJSON', { virtuals: true });
menuSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Menu', menuSchema); 