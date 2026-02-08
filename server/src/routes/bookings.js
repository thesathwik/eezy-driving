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

// DEBUG: Temporary endpoint to diagnose booking visibility issue
const Booking = require('../models/Booking');
const Instructor = require('../models/Instructor');
const Learner = require('../models/Learner');
router.get('/debug/all', async (req, res) => {
  try {
    const bookings = await Booking.find({}).lean();
    const instructors = await Instructor.find({}).select('_id user').lean();
    const learners = await Learner.find({}).select('_id user').lean();
    res.json({
      bookings: bookings.map(b => ({
        _id: b._id,
        status: b.status,
        learner: b.learner,
        instructor: b.instructor,
        lessonDate: b.lesson?.date,
        lessonStartTime: b.lesson?.startTime
      })),
      instructors,
      learners,
      now: new Date()
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
