const Booking = require('../models/Booking');
const Instructor = require('../models/Instructor');
const Learner = require('../models/Learner');

// @desc    Get all bookings for instructor
// @route   GET /api/bookings/instructor/:instructorId
// @access  Private (Instructor)
exports.getInstructorBookings = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Build query
    let query = { instructor: instructorId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query['lesson.date'] = {};
      if (startDate) {
        query['lesson.date'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['lesson.date'].$lte = new Date(endDate);
      }
    }

    const bookings = await Booking.find(query)
      .populate('learner', 'firstName lastName phone email')
      .sort({ 'lesson.date': 1, 'lesson.startTime': 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching instructor bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get upcoming bookings for instructor
// @route   GET /api/bookings/instructor/:instructorId/upcoming
// @access  Private (Instructor)
exports.getUpcomingBookings = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const now = new Date();

    const bookings = await Booking.find({
      instructor: instructorId,
      status: { $in: ['confirmed', 'pending'] },
      'lesson.date': { $gte: now }
    })
      .populate('learner', 'firstName lastName phone email')
      .sort({ 'lesson.date': 1, 'lesson.startTime': 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming bookings',
      error: error.message
    });
  }
};

// @desc    Get pending proposals (bookings awaiting instructor confirmation)
// @route   GET /api/bookings/instructor/:instructorId/pending
// @access  Private (Instructor)
exports.getPendingProposals = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const bookings = await Booking.find({
      instructor: instructorId,
      status: 'pending',
      'lesson.date': { $gte: new Date() }
    })
      .populate('learner', 'firstName lastName phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching pending proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending proposals',
      error: error.message
    });
  }
};

// @desc    Get booking history for instructor
// @route   GET /api/bookings/instructor/:instructorId/history
// @access  Private (Instructor)
exports.getBookingHistory = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const bookings = await Booking.find({
      instructor: instructorId,
      status: { $in: ['completed', 'cancelled', 'no-show'] }
    })
      .populate('learner', 'firstName lastName phone email')
      .sort({ 'lesson.date': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments({
      instructor: instructorId,
      status: { $in: ['completed', 'cancelled', 'no-show'] }
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking history',
      error: error.message
    });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('learner', 'firstName lastName phone email')
      .populate('instructor', 'businessName phone email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Learner)
exports.createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    // Create booking
    const booking = await Booking.create(bookingData);

    // Populate learner and instructor info
    await booking.populate('learner', 'firstName lastName phone email');
    await booking.populate('instructor', 'businessName phone email');

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Instructor/Learner)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;

    // Handle cancellation
    if (status === 'cancelled') {
      booking.cancellation = {
        cancelledBy: req.user.role, // 'instructor' or 'learner'
        cancelledAt: new Date(),
        reason: reason || 'No reason provided'
      };
    }

    // Handle completion
    if (status === 'completed') {
      booking.completion = {
        completedAt: new Date()
      };
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// @desc    Confirm booking (instructor accepts proposal)
// @route   PUT /api/bookings/:id/confirm
// @access  Private (Instructor)
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be confirmed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    await booking.populate('learner', 'firstName lastName phone email');

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming booking',
      error: error.message
    });
  }
};

// @desc    Reject booking (instructor declines proposal)
// @route   PUT /api/bookings/:id/reject
// @access  Private (Instructor)
exports.rejectBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be rejected'
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: 'instructor',
      cancelledAt: new Date(),
      reason: reason || 'Instructor declined'
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
};
