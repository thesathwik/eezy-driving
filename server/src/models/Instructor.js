const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  // Reference to User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Step 1: Personal Details
  preferredFirstName: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'],
    required: true
  },
  postcode: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Postcode must be 4 digits']
  },

  // Step 2: Profile
  profilePhoto: {
    url: String,
    publicId: String // For cloud storage (Cloudinary, S3, etc.)
  },
  bio: {
    type: String,
    required: [true, 'Please provide an instructor bio'],
    maxlength: [1600, 'Bio cannot exceed 1600 characters']
  },
  languages: [{
    type: String,
    required: true
  }],
  memberOfAssociation: {
    type: Boolean,
    default: false
  },
  instructingSince: {
    month: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  },
  services: [{
    type: String,
    enum: [
      'Driving test package: existing customers',
      'Driving test package: new customers',
      'Manual instructor accredited - no vehicle'
    ]
  }],
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    }
  },
  marketplaceVisible: {
    type: Boolean,
    default: true
  },

  // Step 3: Vehicle Details
  vehicle: {
    transmissionOffered: {
      type: String,
      enum: ['auto', 'manual', 'both'],
      required: true
    },
    transmission: {
      type: String,
      enum: ['auto', 'manual'],
      required: true
    },
    registration: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    make: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true,
      min: [1990, 'Vehicle year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Invalid vehicle year']
    },
    ancapRating: {
      type: String,
      required: true,
      enum: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star']
    },
    hasDualControls: {
      type: Boolean,
      default: true
    },
    photo: {
      url: String,
      publicId: String
    }
  },

  // Step 4: Service Area
  serviceArea: {
    suburbs: [{
      type: String,
      required: true
    }],
    testLocations: [{
      type: String
    }]
  },

  // Step 5: Opening Hours
  openingHours: {
    monday: [{
      startTime: String,
      endTime: String
    }],
    tuesday: [{
      startTime: String,
      endTime: String
    }],
    wednesday: [{
      startTime: String,
      endTime: String
    }],
    thursday: [{
      startTime: String,
      endTime: String
    }],
    friday: [{
      startTime: String,
      endTime: String
    }],
    saturday: [{
      startTime: String,
      endTime: String
    }],
    sunday: [{
      startTime: String,
      endTime: String
    }]
  },

  // Step 6: Calendar Settings
  calendarSettings: {
    travelBuffer: {
      sameTransmission: { type: Number, default: 15, enum: [15, 30, 45, 60, 75, 90, 105, 120] },
      differentTransmission: { type: Number, default: 30, enum: [15, 30, 45, 60, 75, 90, 105, 120] }
    },
    syncedCalendarBuffer: { type: Number, default: 0, enum: [0, 15, 30, 45, 60] },
    schedulingWindow: {
      minNotice: { type: Number, default: 3, enum: [3, 5, 12, 24, 48] },
      maxAdvance: { type: Number, default: 90, enum: [75, 90] }
    },
    smartScheduling: {
      enabled: { type: Boolean, default: true },
      slotDuration: { type: Number, default: 1, enum: [1, 2] }
    },
    syncedCalendarVisibility: { type: String, default: 'hide', enum: ['show', 'hide'] },
    attachCalendarEvent: { type: Boolean, default: false },
    defaultCalendarView: { type: String, default: 'day', enum: ['day', 'week', 'month'] }
  },

  // Step 7: Pricing
  pricing: {
    marketplaceLessonRate: {
      type: Number,
      required: true,
      min: [0, 'Lesson rate must be positive']
    },
    privateLessonRate: {
      type: Number,
      required: true,
      min: [0, 'Lesson rate must be positive']
    },
    marketplaceTestPackageRate: {
      type: Number,
      required: true,
      min: [0, 'Test package rate must be positive']
    },
    privateTestPackageRate: {
      type: Number,
      required: true,
      min: [0, 'Test package rate must be positive']
    }
  },

  // Step 8: Banking
  banking: {
    businessName: {
      type: String,
      required: true
    },
    abn: {
      type: String,
      required: true,
      match: [/^\d{11}$/, 'ABN must be 11 digits']
    },
    billingAddress: {
      street: {
        type: String,
        required: true
      },
      suburb: {
        type: String,
        required: true
      },
      postcode: {
        type: String,
        required: true,
        match: [/^\d{4}$/, 'Postcode must be 4 digits']
      },
      state: {
        type: String,
        required: true,
        enum: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
      }
    },
    registeredForGST: {
      type: Boolean,
      default: false
    },
    payoutFrequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'fourWeeks'],
      default: 'weekly'
    },
    bankAccount: {
      accountName: {
        type: String,
        required: true
      },
      bsb: {
        type: String,
        required: true,
        match: [/^\d{6}$/, 'BSB must be 6 digits']
      },
      accountNumber: {
        type: String,
        required: true,
        match: [/^\d{6,9}$/, 'Account number must be 6-9 digits']
      }
    }
  },

  // Statistics and Ratings
  stats: {
    totalLessons: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Verification Status
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    licenceVerified: {
      type: Boolean,
      default: false
    },
    backgroundCheckComplete: {
      type: Boolean,
      default: false
    },
    insuranceVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },

  // Account Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
instructorSchema.index({ user: 1 });
instructorSchema.index({ 'serviceArea.suburbs': 1 });
instructorSchema.index({ status: 1 });
instructorSchema.index({ marketplaceVisible: 1 });
instructorSchema.index({ 'stats.averageRating': -1 });
instructorSchema.index({ createdAt: -1 });

// Virtual populate for bookings
instructorSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'instructor'
});

// Virtual populate for reviews
instructorSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'instructor'
});

// Calculate years of experience
instructorSchema.virtual('yearsOfExperience').get(function() {
  if (!this.instructingSince || !this.instructingSince.year) return 0;

  const currentYear = new Date().getFullYear();
  const startYear = this.instructingSince.year;
  return currentYear - startYear;
});

module.exports = mongoose.model('Instructor', instructorSchema);
