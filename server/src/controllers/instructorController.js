const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Availability = require('../models/Availability');

// Helper function to generate availability records from opening hours
const generateAvailabilityFromOpeningHours = async (instructorId, openingHours, calendarSettings) => {
  try {
    // Map day of week (0=Sunday) to lowercase day names used in openingHours
    const dayMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    console.log('📅 Generating availability for instructor:', instructorId);
    console.log('📅 Opening hours:', JSON.stringify(openingHours));

    // Delete existing future availability to clear any incorrectly-dated records
    const now = new Date();
    await Availability.deleteMany({
      instructorId,
      date: { $gte: now }
    });
    console.log('🗑️ Cleared existing future availability for instructor:', instructorId);

    // Generate availability for next maxAdvance days (default 90)
    const maxAdvanceDays = calendarSettings?.schedulingWindow?.maxAdvance || 90;
    // Use UTC consistently to avoid timezone mismatches between server and client
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));

    let daysGenerated = 0;

    for (let i = 0; i < maxAdvanceDays; i++) {
      const date = new Date(todayUTC.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getUTCDay();

      // Get the lowercase day name
      const dayName = dayMap[dayOfWeek];
      const hoursForDay = openingHours[dayName] || [];

      // Skip if no hours defined for this day
      if (hoursForDay.length === 0) continue;

      // Generate time slots based on opening hours
      const timeSlots = [];
      hoursForDay.forEach(hourRange => {
        // Support both formats: {start, end} and {startTime, endTime}
        const startTimeStr = hourRange.startTime || hourRange.start;
        const endTimeStr = hourRange.endTime || hourRange.end;

        if (startTimeStr && endTimeStr) {
          // Parse start and end times (format: "09:00" or "17:00")
          const startHour = parseTime(startTimeStr);
          const endHour = parseTime(endTimeStr);

          console.log(`  📅 ${dayName}: ${startTimeStr}-${endTimeStr} → hours ${startHour}-${endHour}`);

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
        daysGenerated++;
      }
    }

    console.log(`✅ Generated availability for ${daysGenerated} days for instructor ${instructorId}`);
  } catch (error) {
    console.error('Error generating availability:', error);
  }
};

// Helper to parse time string like "09:00", "17:00", "09:00 A", or "05:00 P" to hour number
const parseTime = (timeStr) => {
  if (!timeStr) return 0;

  // Try 24-hour format first (e.g., "09:00", "17:00")
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1]);
  }

  // Try 12-hour format with AM/PM (e.g., "09:00 A", "05:00 PM")
  const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(A|P)/i);
  if (match12) {
    let hour = parseInt(match12[1]);
    const isPM = match12[3].toUpperCase() === 'P';

    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    return hour;
  }

  return 0;
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

      // Update user's profile completion status and ensure role is 'instructor'
      await User.findByIdAndUpdate(userId, {
        isProfileComplete: true,
        role: 'instructor'
      });
    }

    // Generate availability records if openingHours are provided
    if (req.body.openingHours) {
      await generateAvailabilityFromOpeningHours(userId, req.body.openingHours, instructor.calendarSettings);
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
// @desc    Regenerate availability for all instructors (Admin/Dev tool)
// @route   POST /api/instructors/regenerate-availability
// @access  Public (Temporary for debugging)
exports.regenerateAvailability = async (req, res, next) => {
  try {
    const instructors = await Instructor.find({});
    console.log(`Found ${instructors.length} instructors for availability regeneration`);

    let totalGenerated = 0;
    const results = [];

    for (const instructor of instructors) {
      console.log(`Processing instructor: ${instructor._id}`);
      console.log(`  User ID: ${instructor.user}`);
      console.log(`  Has openingHours: ${!!instructor.openingHours}`);
      console.log(`  openingHours:`, JSON.stringify(instructor.openingHours));

      if (!instructor.openingHours) {
        results.push({ id: instructor._id, status: 'skipped - no openingHours' });
        continue;
      }

      // Call the helper function directly
      await generateAvailabilityFromOpeningHours(instructor.user, instructor.openingHours, instructor.calendarSettings);
      totalGenerated++;
      results.push({ id: instructor._id, userId: instructor.user, status: 'generated' });
    }

    res.status(200).json({
      success: true,
      message: `Regenerated availability for ${totalGenerated} instructors`,
      count: totalGenerated,
      details: results
    });
  } catch (error) {
    console.error('Error in regenerateAvailability:', error);
    next(error);
  }
};
