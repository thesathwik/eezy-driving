const User = require('../models/User');
const Instructor = require('../models/Instructor');

// @desc    Create or update instructor profile
// @route   POST /api/instructors/profile
// @access  Private (Instructor only)
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if instructor profile already exists
    let instructor = await Instructor.findOne({ user: userId });

    const profileData = {
      user: userId,
      ...req.body
    };

    if (instructor) {
      // Update existing profile
      instructor = await Instructor.findOneAndUpdate(
        { user: userId },
        profileData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      instructor = await Instructor.create(profileData);

      // Update user's profile completion status
      await User.findByIdAndUpdate(userId, {
        isProfileComplete: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Instructor profile saved successfully',
      data: instructor
    });
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
};

// @desc    Get instructor profile
// @route   GET /api/instructors/profile
// @access  Private (Instructor only)
exports.getProfile = async (req, res, next) => {
  try {
    const instructor = await Instructor.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phone');

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all instructors (for marketplace)
// @route   GET /api/instructors
// @access  Public
exports.getAllInstructors = async (req, res, next) => {
  try {
    const {
      suburb,
      transmission,
      minRating,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {
      marketplaceVisible: true,
      status: 'active'
    };

    if (suburb) {
      query['serviceArea.suburbs'] = { $in: [suburb] };
    }

    if (transmission) {
      query['vehicle.transmissionOffered'] = { $in: [transmission, 'both'] };
    }

    if (minRating) {
      query['stats.averageRating'] = { $gte: parseFloat(minRating) };
    }

    // Execute query with pagination
    const instructors = await Instructor.find(query)
      .populate('user', 'firstName lastName')
      .select('-banking') // Don't include sensitive banking info
      .sort({ 'stats.averageRating': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const count = await Instructor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: instructors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalInstructors: count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single instructor by ID
// @route   GET /api/instructors/:id
// @access  Public
exports.getInstructorById = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'reviews',
        match: { status: 'approved' },
        options: { sort: { createdAt: -1 }, limit: 10 }
      })
      .select('-banking'); // Don't include sensitive banking info

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Only show active instructors on marketplace
    if (instructor.status !== 'active' && !instructor.marketplaceVisible) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update instructor availability
// @route   PUT /api/instructors/availability
// @access  Private (Instructor only)
exports.updateAvailability = async (req, res, next) => {
  try {
    const { openingHours } = req.body;

    const instructor = await Instructor.findOneAndUpdate(
      { user: req.user._id },
      { openingHours },
      { new: true, runValidators: true }
    );

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update instructor pricing
// @route   PUT /api/instructors/pricing
// @access  Private (Instructor only)
exports.updatePricing = async (req, res, next) => {
  try {
    const { pricing } = req.body;

    const instructor = await Instructor.findOneAndUpdate(
      { user: req.user._id },
      { pricing },
      { new: true, runValidators: true }
    );

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing updated successfully',
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle marketplace visibility
// @route   PUT /api/instructors/visibility
// @access  Private (Instructor only)
exports.toggleVisibility = async (req, res, next) => {
  try {
    const { marketplaceVisible } = req.body;

    const instructor = await Instructor.findOneAndUpdate(
      { user: req.user._id },
      { marketplaceVisible },
      { new: true }
    );

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Marketplace visibility ${marketplaceVisible ? 'enabled' : 'disabled'}`,
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get instructor stats
// @route   GET /api/instructors/stats
// @access  Private (Instructor only)
exports.getStats = async (req, res, next) => {
  try {
    const instructor = await Instructor.findOne({ user: req.user._id });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: instructor.stats
    });
  } catch (error) {
    next(error);
  }
};
