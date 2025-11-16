const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // References
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Learner',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },

  // Booking Details
  bookingType: {
    type: String,
    enum: ['lesson', 'test-package'],
    required: true
  },
  learnerType: {
    type: String,
    enum: ['marketplace', 'private'],
    default: 'marketplace'
  },

  // Lesson Details
  lesson: {
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in hours
      required: true,
      min: 0.5,
      max: 8
    },
    pickupLocation: {
      address: String,
      suburb: String,
      postcode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    dropoffLocation: {
      address: String,
      suburb: String,
      postcode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    notes: String
  },

  // Pricing
  pricing: {
    baseRate: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      default: 0
    },
    gst: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    instructorPayout: {
      type: Number,
      required: true
    }
  },

  // Payment Status
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'bank-transfer', 'cash']
    },
    transactionId: String,
    paymentIntentId: String, // Stripe PaymentIntent ID for tracking
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },

  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },

  // Cancellation
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['learner', 'instructor', 'admin']
    },
    cancelledAt: Date,
    reason: String,
    refundIssued: {
      type: Boolean,
      default: false
    }
  },

  // Completion
  completion: {
    completedAt: Date,
    actualDuration: Number,
    instructorNotes: String,
    learnerNotes: String,
    skillsAssessed: [{
      skill: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }]
  },

  // Review
  hasReview: {
    type: Boolean,
    default: false
  },

  // Reminders Sent
  reminders: {
    oneDayBefore: {
      type: Boolean,
      default: false
    },
    twoHoursBefore: {
      type: Boolean,
      default: false
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookingSchema.index({ learner: 1, createdAt: -1 });
bookingSchema.index({ instructor: 1, 'lesson.date': -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'lesson.date': 1 });
bookingSchema.index({ 'payment.status': 1 });

// Compound index for availability checking
bookingSchema.index({ instructor: 1, 'lesson.date': 1, status: 1 });

// Calculate GST and platform fee before saving
bookingSchema.pre('save', function(next) {
  if (this.isModified('pricing.baseRate')) {
    const baseRate = this.pricing.baseRate;

    // Platform fee: 10% (you can adjust this)
    if (this.learnerType === 'marketplace') {
      this.pricing.platformFee = baseRate * 0.10;
    } else {
      this.pricing.platformFee = 0;
    }

    // GST: 10% if instructor is registered for GST
    // This should be checked against instructor's GST registration status
    this.pricing.gst = baseRate * 0.10;

    // Total amount
    this.pricing.totalAmount = baseRate + this.pricing.platformFee + this.pricing.gst;

    // Instructor payout (base rate - platform fee)
    this.pricing.instructorPayout = baseRate - this.pricing.platformFee;
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
