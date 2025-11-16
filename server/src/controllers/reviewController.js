const Review = require('../models/Review');
const Instructor = require('../models/Instructor');
const Learner = require('../models/Learner');

/**
 * @desc    Get all reviews for a specific instructor
 * @route   GET /api/reviews/instructor/:instructorId
 * @access  Public
 */
exports.getInstructorReviews = async (req, res, next) => {
  try {
    const { instructorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Verify instructor exists
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Get reviews with pagination, only approved reviews
    const reviews = await Review.find({
      instructor: instructorId,
      status: 'approved'
    })
      .populate('learner', 'user')
      .populate({
        path: 'learner',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      instructor: instructorId,
      status: 'approved'
    });

    // Transform reviews to match frontend format
    const transformedReviews = reviews.map(review => ({
      id: review._id,
      name: review.learner?.user ? `${review.learner.user.firstName} ${review.learner.user.lastName}`.trim() : 'Anonymous',
      date: new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      rating: review.rating,
      comment: review.comment,
      title: review.title,
      wouldRecommend: review.wouldRecommend,
      instructorResponse: review.instructorResponse,
      helpfulCount: review.helpfulCount
    }));

    res.status(200).json({
      success: true,
      data: transformedReviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        reviewsPerPage: limit,
        hasMore: skip + reviews.length < totalReviews
      }
    });
  } catch (error) {
    console.error('Error fetching instructor reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get all reviews (admin)
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('learner', 'user')
      .populate('instructor', 'user')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private (Learner only)
 */
exports.createReview = async (req, res, next) => {
  try {
    const { booking, instructor, rating, comment, title, wouldRecommend, ratings } = req.body;

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const review = await Review.create({
      booking,
      learner: req.user.learnerId, // Assuming user is authenticated and has learnerId
      instructor,
      rating,
      comment,
      title,
      wouldRecommend,
      ratings,
      status: 'approved' // Auto-approve for now, can add moderation later
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private (Owner or Admin)
 */
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Admin only)
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.remove();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};
