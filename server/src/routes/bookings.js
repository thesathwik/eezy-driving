const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInstructorBookings,
  getUpcomingBookings,
  getPendingProposals,
  getBookingHistory,
  getInstructorLearners,
  getLearnerUpcoming,
  getLearnerHistory,
  getBooking,
  createBooking,
  updateBookingStatus,
  confirmBooking,
  rejectBooking,
  deleteBooking
} = require('../controllers/bookingController');

// ONE-TIME: Cancel overlapping bookings for an instructor on a given date
const Booking = require('../models/Booking');
const Learner = require('../models/Learner');
router.get('/fix/cancel-overlaps', async (req, res) => {
  try {
    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    // Find all confirmed/pending bookings grouped by instructor + date
    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'pending'] }
    }).sort({ createdAt: 1 }); // earlier bookings take priority

    const cancelled = [];
    const kept = new Map(); // key: instructorId+date -> array of kept bookings

    for (const booking of bookings) {
      const key = `${booking.instructor}_${new Date(booking.lesson.date).toISOString().split('T')[0]}`;
      const existing = kept.get(key) || [];

      const newStart = parseTime(booking.lesson.startTime);
      const newEnd = newStart + (booking.lesson.duration || 1) * 60;

      let hasConflict = false;
      for (const ex of existing) {
        if (newStart < ex.end && newEnd > ex.start) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        booking.status = 'cancelled';
        booking.cancellation = {
          cancelledBy: 'admin',
          cancelledAt: new Date(),
          reason: 'Cancelled due to time overlap with existing booking'
        };
        await booking.save();

        // Refund credits to learner
        const learner = await Learner.findById(booking.learner);
        if (learner) {
          const refund = booking.lesson.duration || 1;
          learner.progress.lessonCredits = (learner.progress.lessonCredits || 0) + refund;
          await learner.save();
          cancelled.push({
            bookingId: booking._id,
            time: `${booking.lesson.startTime} - ${booking.lesson.endTime}`,
            creditsRefunded: refund
          });
        }
      } else {
        existing.push({ start: newStart, end: newEnd });
        kept.set(key, existing);
      }
    }

    res.json({ success: true, cancelled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Instructor booking routes
router.get('/instructor/:instructorId', protect, getInstructorBookings);
router.get('/instructor/:instructorId/upcoming', protect, getUpcomingBookings);
router.get('/instructor/:instructorId/pending', protect, getPendingProposals);
router.get('/instructor/:instructorId/history', protect, getBookingHistory);
router.get('/instructor/:instructorId/learners', protect, getInstructorLearners);

// Learner booking routes
router.get('/learner/:learnerId/upcoming', protect, getLearnerUpcoming);
router.get('/learner/:learnerId/history', protect, getLearnerHistory);

// General booking routes
router.get('/:id', protect, getBooking);
router.post('/', protect, createBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/confirm', protect, confirmBooking);
router.put('/:id/reject', protect, rejectBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
