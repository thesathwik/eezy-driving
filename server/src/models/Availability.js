const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  }
});

const availabilitySchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [timeSlotSchema],
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
availabilitySchema.index({ instructorId: 1, date: 1 });

// Method to check if a time slot is available
availabilitySchema.methods.isTimeSlotAvailable = function(time) {
  const slot = this.timeSlots.find(s => s.time === time);
  return slot ? slot.available : false;
};

// Method to book a time slot
availabilitySchema.methods.bookTimeSlot = function(time, bookingId) {
  const slot = this.timeSlots.find(s => s.time === time);
  if (slot && slot.available) {
    slot.available = false;
    slot.bookingId = bookingId;
    return true;
  }
  return false;
};

// Method to cancel a time slot
availabilitySchema.methods.cancelTimeSlot = function(time) {
  const slot = this.timeSlots.find(s => s.time === time);
  if (slot) {
    slot.available = true;
    slot.bookingId = null;
    return true;
  }
  return false;
};

// Static method to generate default time slots (5am - 9pm)
availabilitySchema.statics.generateDefaultTimeSlots = function() {
  const slots = [];
  const times = [
    '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  times.forEach(time => {
    slots.push({ time, available: true });
  });

  return slots;
};

module.exports = mongoose.model('Availability', availabilitySchema);
