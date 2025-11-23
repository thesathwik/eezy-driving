const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Availability = require('../models/Availability');

// Helper function to generate availability records from opening hours
const generateAvailabilityFromOpeningHours = async (instructorId, openingHours) => {
  try {
    const dayMap = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };

    // Generate availability for next 60 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();

      // Find which day name matches this day of week
      const dayName = Object.keys(dayMap).find(name => dayMap[name] === dayOfWeek);
      const hoursForDay = openingHours[dayName] || [];

      // Skip if no hours defined for this day
      if (hoursForDay.length === 0) continue;

      // Generate time slots based on opening hours
      const timeSlots = [];
      hoursForDay.forEach(hourRange => {
        if (hourRange.start && hourRange.end) {
          // Parse start and end times
          const startHour = parseTime(hourRange.start);
          const endHour = parseTime(hourRange.end);

          // Generate hourly slots between start and end
          for (let hour = startHour; hour < endHour; hour++) {
            const timeStr = formatHour(hour);
            timeSlots.push({ time: timeStr, available: true });
          }
        }
      });

      if (timeSlots.length > 0) {
        // Upsert availability for this date
        await Availability.findOneAndUpdate(
          { instructorId, date },
          { instructorId, date, timeSlots, enabled: true },
          { upsert: true, new: true }
        );
      }
    }

    console.log(`✅ Generated availability for instructor ${instructorId}`);
  } catch (error) {
    console.error('Error generating availability:', error);
  }
};

// Helper to parse time string like "09:00 A" or "05:00 P" to hour number
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(A|P)?/i);
  if (!match) return 0;

  let hour = parseInt(match[1]);
  const isPM = match[3] && match[3].toUpperCase() === 'P';

  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;

  return hour;
};

// Helper to format hour number to display string
const formatHour = (hour) => {
  const isPM = hour >= 12;
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${isPM ? 'PM' : 'AM'}`;
};

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

    // Generate availability records if openingHours are provided
    if (req.body.openingHours) {
      await generateAvailabilityFromOpeningHours(userId, req.body.openingHours);
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
