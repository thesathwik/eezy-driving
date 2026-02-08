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

    // Try to find instructor profile by user ID or instructor ID
    let instructor = await Instructor.findOne({ user: instructorId });
    if (!instructor) {
      instructor = await Instructor.findById(instructorId);
    }

    // If still no instructor found, try using the ID directly (for backwards compatibility)
    const instructorIdToUse = instructor ? instructor._id : instructorId;

    // Build query
    let query = { instructor: instructorIdToUse };

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
      .populate({
        path: 'learner',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
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
    // Use start of today UTC so today's bookings (stored as midnight UTC) still show
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    // Try to find instructor profile by user ID or instructor ID
    let instructor = await Instructor.findOne({ user: instructorId });
    if (!instructor) {
      instructor = await Instructor.findById(instructorId);
    }

    const instructorIdToUse = instructor ? instructor._id : instructorId;

    const bookings = await Booking.find({
      instructor: instructorIdToUse,
      status: { $in: ['confirmed', 'pending'] },
      'lesson.date': { $gte: now }
    })
      .populate({
        path: 'learner',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
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

    // Try to find instructor profile by user ID or instructor ID
    let instructor = await Instructor.findOne({ user: instructorId });
    if (!instructor) {
      instructor = await Instructor.findById(instructorId);
    }

    const instructorIdToUse = instructor ? instructor._id : instructorId;

    const bookings = await Booking.find({
      instructor: instructorIdToUse,
      status: 'pending',
      'lesson.date': { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) }
    })
      .populate({
        path: 'learner',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
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

    // Try to find instructor profile by user ID or instructor ID
    let instructor = await Instructor.findOne({ user: instructorId });
    if (!instructor) {
      instructor = await Instructor.findById(instructorId);
    }

    const instructorIdToUse = instructor ? instructor._id : instructorId;

    const bookings = await Booking.find({
      instructor: instructorIdToUse,
      status: { $in: ['completed', 'cancelled', 'no-show'] }
    })
      .populate({
        path: 'learner',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
      .sort({ 'lesson.date': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments({
      instructor: instructorIdToUse,
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
    const { learner: learnerId, lesson } = bookingData;

    // Check if learner has credits
    let learner = await Learner.findById(learnerId);

    // If not found by ID, it might be a User ID
    if (!learner) {
      console.log(`Learner not found by ID ${learnerId}, checking if it's a User ID...`);
      learner = await Learner.findOne({ user: learnerId });

      // If still not found, check if it's a valid User and create a profile
      if (!learner) {
        const User = require('../models/User');
        const userExists = await User.findById(learnerId);

        if (userExists) {
          console.log(`Creating new Learner profile for User ${learnerId}...`);
          learner = await Learner.create({
            user: learnerId,
            // Add default required fields if any (DOB is now optional)
            preferences: {
              transmissionType: 'auto',
              timePreference: 'flexible'
            }
          });
          // Update the booking data to use the new Learner ID
          bookingData.learner = learner._id;
        }
      }
    }

    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found and could not be created'
      });
    }

    const creditsNeeded = lesson.duration; // 1 or 2 credits
    let availableCredits = learner.progress.lessonCredits || 0;

    // Handle Race Condition: If insufficient credits, check if we have a valid payment transaction
    if (availableCredits < creditsNeeded && bookingData.payment && bookingData.payment.transactionId) {
      console.log(`Checking payment verification for transaction: ${bookingData.payment.transactionId}`);

      try {
        // Verify with Stripe
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(bookingData.payment.transactionId);

        // Check if payment was successful and matches
        if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.type === 'package_purchase') {

          // Check if this payment was already processed
          const isProcessed = learner.progress.processedPaymentIntents?.includes(paymentIntent.id);

          if (!isProcessed) {
            const newCredits = parseInt(paymentIntent.metadata.credits || 0);

            if (newCredits > 0) {
              console.log(`✅ Verified payment ${paymentIntent.id}. Adding ${newCredits} credits immediately.`);

              // Add credits
              learner.progress.lessonCredits = (learner.progress.lessonCredits || 0) + newCredits;
              availableCredits = learner.progress.lessonCredits;

              // Mark as processed
              if (!learner.progress.processedPaymentIntents) {
                learner.progress.processedPaymentIntents = [];
              }
              learner.progress.processedPaymentIntents.push(paymentIntent.id);

              await learner.save();
            }
          }
        }
      } catch (stripeError) {
        console.error('Error verifying Stripe payment in booking controller:', stripeError);
        // Continue to standard check (will fail if credits still insufficient)
      }
    }

    if (availableCredits >= creditsNeeded) {
      // Use credits
      learner.progress.lessonCredits -= creditsNeeded;
      await learner.save();

      // Set booking as confirmed and paid
      bookingData.status = 'confirmed';
      // Preserve the original payment method from the request, or default to 'credit-card'
      bookingData.payment = {
        status: 'paid',
        method: bookingData.payment?.method || 'credit-card', // Use the method from request
        paidAt: new Date(),
        transactionId: bookingData.payment?.transactionId // Keep the transaction ID reference
      };

      console.log(`✅ Deducted ${creditsNeeded} credits from learner ${learnerId}. Remaining: ${learner.progress.lessonCredits}`);
    } else {
      // If not enough credits, we expect a payment intent or return error
      // For now, we'll return an error as per requirement "Only Learners who have paid can book"
      // Unless the frontend handles the "pay now" flow separately, but the prompt implies prepaid model.
      return res.status(400).json({
        success: false,
        message: `Insufficient lesson credits. You have ${availableCredits}, but need ${creditsNeeded}. Please purchase a package.`
      });
    }

    // Create booking
    const booking = await Booking.create(bookingData);

    // Populate learner and instructor info with nested user references
    await booking.populate({
      path: 'learner',
      populate: {
        path: 'user',
        select: 'firstName lastName phone email'
      }
    });
    await booking.populate({
      path: 'instructor',
      populate: {
        path: 'user',
        select: 'firstName lastName phone email'
      }
    });

    // Send confirmation emails immediately since it's confirmed
    if (booking.status === 'confirmed') {
      const { sendBookingConfirmation } = require('../services/emailService');

      const emailData = {
        learner: {
          firstName: booking.learner?.user?.firstName || 'Learner',
          lastName: booking.learner?.user?.lastName || '',
          email: booking.learner?.user?.email || '',
          phone: booking.learner?.user?.phone || ''
        },
        instructor: {
          firstName: booking.instructor?.user?.firstName || 'Instructor',
          lastName: booking.instructor?.user?.lastName || '',
          email: booking.instructor?.user?.email || ''
        },
        lesson: {
          date: booking.lesson.date,
          startTime: booking.lesson.startTime,
          endTime: booking.lesson.endTime,
          duration: booking.lesson.duration,
          pickupLocation: booking.lesson.pickupLocation,
          dropoffLocation: booking.lesson.dropoffLocation,
          notes: booking.lesson.notes
        },
        pricing: {
          totalAmount: booking.pricing.totalAmount,
          instructorPayout: booking.pricing.instructorPayout
        }
      };

      try {
        console.log('📧 Sending booking confirmation emails...');
        console.log('📧 Learner email:', emailData.learner.email);
        console.log('📧 Instructor email:', emailData.instructor.email);
        const emailResult = await sendBookingConfirmation(emailData);
        console.log('✅ Booking confirmation emails sent successfully:', emailResult);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
      }
    }

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

    await booking.populate({
      path: 'learner',
      populate: {
        path: 'user',
        select: 'firstName lastName phone email'
      }
    });

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

// @desc    Get upcoming bookings for learner
// @route   GET /api/bookings/learner/:learnerId/upcoming
// @access  Private (Learner)
exports.getLearnerUpcoming = async (req, res) => {
  try {
    const { learnerId } = req.params;
    // Use start of today UTC so today's bookings (stored as midnight UTC) still show
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    // Resolve learnerId — could be User._id or Learner._id
    let learner = await Learner.findOne({ user: learnerId });
    if (!learner) {
      learner = await Learner.findById(learnerId);
    }

    const learnerIdToUse = learner ? learner._id : learnerId;

    const bookings = await Booking.find({
      learner: learnerIdToUse,
      status: { $in: ['confirmed', 'pending'] },
      'lesson.date': { $gte: now }
    })
      .populate({
        path: 'instructor',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
      .sort({ 'lesson.date': 1, 'lesson.startTime': 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching learner upcoming bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming bookings',
      error: error.message
    });
  }
};

// @desc    Get booking history for learner
// @route   GET /api/bookings/learner/:learnerId/history
// @access  Private (Learner)
exports.getLearnerHistory = async (req, res) => {
  try {
    const { learnerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Resolve learnerId — could be User._id or Learner._id
    let learner = await Learner.findOne({ user: learnerId });
    if (!learner) {
      learner = await Learner.findById(learnerId);
    }

    const learnerIdToUse = learner ? learner._id : learnerId;

    const bookings = await Booking.find({
      learner: learnerIdToUse,
      status: { $in: ['completed', 'cancelled', 'no-show'] }
    })
      .populate({
        path: 'instructor',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
      .sort({ 'lesson.date': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments({
      learner: learnerIdToUse,
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
    console.error('Error fetching learner booking history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking history',
      error: error.message
    });
  }
};

// @desc    Get all learners for instructor
// @route   GET /api/bookings/instructor/:instructorId/learners
// @access  Private (Instructor)
exports.getInstructorLearners = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Try to find instructor profile by user ID or instructor ID
    let instructor = await Instructor.findOne({ user: instructorId });
    if (!instructor) {
      instructor = await Instructor.findById(instructorId);
    }

    const instructorIdToUse = instructor ? instructor._id : instructorId;

    // Get all bookings for this instructor to find unique learners
    const bookings = await Booking.find({
      instructor: instructorIdToUse
    })
      .populate({
        path: 'learner',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      })
      .sort({ createdAt: -1 });

    // Create a map of learners with their stats
    const learnersMap = new Map();

    bookings.forEach(booking => {
      if (!booking.learner) return;

      const learnerId = booking.learner._id.toString();
      const learnerUser = booking.learner.user || {};

      if (!learnersMap.has(learnerId)) {
        learnersMap.set(learnerId, {
          _id: booking.learner._id,
          firstName: learnerUser.firstName,
          lastName: learnerUser.lastName,
          phone: learnerUser.phone,
          email: learnerUser.email,
          completedHours: 0,
          upcomingBookings: 0,
          totalBookings: 0
        });
      }

      const learnerData = learnersMap.get(learnerId);
      learnerData.totalBookings++;

      // Count completed hours
      if (booking.status === 'completed') {
        learnerData.completedHours += booking.lesson.duration || 0;
      }

      // Count upcoming bookings
      if (booking.status === 'confirmed' && new Date(booking.lesson.date) >= new Date()) {
        learnerData.upcomingBookings++;
      }
    });

    // Convert map to array
    const learners = Array.from(learnersMap.values());

    res.status(200).json({
      success: true,
      count: learners.length,
      data: learners
    });
  } catch (error) {
    console.error('Error fetching instructor learners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching learners',
      error: error.message
    });
  }
};
