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

// ONE-TIME FIX: Correct booking duration and credits for bookings created with hardcoded duration=1
const Booking = require('../models/Booking');
const Learner = require('../models/Learner');
router.get('/fix/duration-credits', async (req, res) => {
  try {
    // Find all bookings with duration=1 and endTime='00:00' (created by the buggy code)
    const badBookings = await Booking.find({
      'lesson.duration': 1,
      'lesson.endTime': '00:00'
    });

    const fixes = [];
    for (const booking of badBookings) {
      // Assume these were supposed to be 2-hour bookings based on the user's report
      // Update booking duration to 2 and calculate proper endTime
      const oldDuration = booking.lesson.duration;
      const newDuration = 2;
      const creditDiff = newDuration - oldDuration; // 1 extra credit to deduct

      booking.lesson.duration = newDuration;

      // Calculate endTime from startTime
      const match = booking.lesson.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const totalMin = h * 60 + m + newDuration * 60;
        const endH = Math.floor(totalMin / 60) % 24;
        const endM = totalMin % 60;
        const endPeriod = endH >= 12 ? 'PM' : 'AM';
        const displayH = endH % 12 || 12;
        booking.lesson.endTime = `${displayH}:${String(endM).padStart(2, '0')} ${endPeriod}`;
      }

      await booking.save();

      // Deduct the extra credit from the learner
      if (creditDiff > 0) {
        const learner = await Learner.findById(booking.learner);
        if (learner) {
          learner.progress.lessonCredits = Math.max(0, (learner.progress.lessonCredits || 0) - creditDiff);
          await learner.save();
          fixes.push({
            bookingId: booking._id,
            newDuration,
            newEndTime: booking.lesson.endTime,
            creditsDeducted: creditDiff,
            remainingCredits: learner.progress.lessonCredits
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Fixed ${fixes.length} bookings`,
      fixes
    });
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
