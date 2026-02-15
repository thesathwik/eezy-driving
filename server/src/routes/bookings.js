const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInstructorBookings,
  getBookedSlots,
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

// Instructor booking routes
router.get('/instructor/:instructorId', protect, getInstructorBookings);
router.get('/instructor/:instructorId/booked-slots', getBookedSlots);
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
