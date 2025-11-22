const mongoose = require('mongoose');

const learnerSchema = new mongoose.Schema({
  // Reference to User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Personal Details
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say']
  },

  // Address
  address: {
    street: String,
    suburb: String,
    postcode: {
      type: String,
      match: [/^\d{4}$/, 'Postcode must be 4 digits']
    },
    state: {
      type: String,
      enum: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
    }
  },

  // Licence Information
  licence: {
    number: String,
    type: {
      type: String,
      enum: ['learner', 'provisional-p1', 'provisional-p2', 'full', 'international'],
      default: 'learner'
    },
    issueDate: Date,
    expiryDate: Date,
    state: {
      type: String,
      enum: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
    }
  },

  // Learning Preferences
  preferences: {
    transmissionType: {
      type: String,
      enum: ['auto', 'manual', 'both'],
      default: 'auto'
    },
    languages: [{
      type: String
    }],
    pickupLocation: {
      suburb: String,
      postcode: String
    },
    availability: {
      monday: Boolean,
      tuesday: Boolean,
      wednesday: Boolean,
      thursday: Boolean,
      friday: Boolean,
      saturday: Boolean,
      sunday: Boolean
    },
    timePreference: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'flexible'],
      default: 'flexible'
    }
  },

  // Progress Tracking
  progress: {
    totalLessonsCompleted: {
      type: Number,
      default: 0
    },
    totalHoursCompleted: {
      type: Number,
      default: 0
    },
    currentInstructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instructor'
    },
    testsPassed: {
      type: Number,
      default: 0
    },
    testsFailed: {
      type: Number,
      default: 0
    },
    nextTestDate: Date,
    testLocation: String,
    logbookHours: {
      type: Number,
      default: 0
    },
    lessonCredits: {
      type: Number,
      default: 0
    }
  },

  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // Notes (for instructors)
  notes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
learnerSchema.index({ user: 1 });
learnerSchema.index({ 'address.suburb': 1 });
learnerSchema.index({ status: 1 });
learnerSchema.index({ createdAt: -1 });

// Virtual populate for bookings
learnerSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'learner'
});

// Calculate age
learnerSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

module.exports = mongoose.model('Learner', learnerSchema);
