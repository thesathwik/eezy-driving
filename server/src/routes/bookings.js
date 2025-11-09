const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInstructorBookings,
  getUpcomingBookings,
  getPendingProposals,
  getBookingHistory,
  getBooking,
  createBooking,
  updateBookingStatus,
  confirmBooking,
  rejectBooking,
  deleteBooking
} = require('../controllers/bookingController');

// Instructor booking routes
router.get('/instructor/:instructorId', protect, getInstructorBookings);
router.get('/instructor/:instructorId/upcoming', protect, getUpcomingBookings);
router.get('/instructor/:instructorId/pending', protect, getPendingProposals);
router.get('/instructor/:instructorId/history', protect, getBookingHistory);

// General booking routes
router.get('/:id', protect, getBooking);
router.post('/', protect, createBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/confirm', protect, confirmBooking);
router.put('/:id/reject', protect, rejectBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
