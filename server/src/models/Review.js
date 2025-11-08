const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // References
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
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

  // Rating (out of 5)
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },

  // Individual ratings
  ratings: {
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    teaching: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    vehicleCondition: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Review Content
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please provide a comment'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },

  // Would Recommend
  wouldRecommend: {
    type: Boolean,
    default: true
  },

  // Instructor Response
  instructorResponse: {
    comment: String,
    respondedAt: Date
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Flags
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,

  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reviewSchema.index({ instructor: 1, createdAt: -1 });
reviewSchema.index({ learner: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });

// Static method to calculate average rating for an instructor
reviewSchema.statics.calculateAverageRating = async function(instructorId) {
  const stats = await this.aggregate([
    {
      $match: {
        instructor: instructorId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$instructor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    // Update instructor stats
    await mongoose.model('Instructor').findByIdAndUpdate(instructorId, {
      'stats.averageRating': Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
      'stats.totalReviews': stats[0].totalReviews
    });
  } else {
    // No reviews, reset to 0
    await mongoose.model('Instructor').findByIdAndUpdate(instructorId, {
      'stats.averageRating': 0,
      'stats.totalReviews': 0
    });
  }
};

// Update instructor's average rating after a new review is saved
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.instructor);
});

// Update instructor's average rating after a review is deleted
reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.instructor);
});

module.exports = mongoose.model('Review', reviewSchema);
