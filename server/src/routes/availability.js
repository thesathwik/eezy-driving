const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Instructor = require('../models/Instructor');
const { protect, restrictTo } = require('../middleware/auth');

// Helper: combine a date and a time string like "9:00 AM" into a full Date object
const combineDateAndTime = (date, timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const result = new Date(date);
  result.setUTCHours(h, m, 0, 0);
  return result;
};

// @route   GET /api/availability/instructor/:instructorId
// @desc    Get instructor availability for a date range
// @access  Public
router.get('/instructor/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;
    let { startDate, endDate } = req.query;

    // Look up instructor to get calendarSettings
    const instructor = await Instructor.findOne({ user: instructorId }) || await Instructor.findById(instructorId);
    const calendarSettings = instructor?.calendarSettings;
    const minNoticeHours = calendarSettings?.schedulingWindow?.minNotice || 3;
    const maxAdvanceDays = calendarSettings?.schedulingWindow?.maxAdvance || 90;

    const now = new Date();

    // Clamp endDate to not exceed maxAdvance days from now
    const maxDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
    if (endDate) {
      const requestedEnd = new Date(endDate);
      if (requestedEnd > maxDate) {
        endDate = maxDate.toISOString();
      }
    } else {
      endDate = maxDate.toISOString();
    }

    const query = { instructorId, enabled: true };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const availability = await Availability.find(query).sort({ date: 1 });

    // Filter out slots that are within minNotice hours of now
    const minNoticeThreshold = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
    const filteredAvailability = availability.map(avail => {
      const doc = avail.toObject();
      doc.timeSlots = doc.timeSlots.filter(slot => {
        if (!slot.time) return true;
        const slotDateTime = combineDateAndTime(doc.date, slot.time);
        if (!slotDateTime) return true;
        return slotDateTime >= minNoticeThreshold;
      });
      return doc;
    }).filter(doc => doc.timeSlots.length > 0);

    res.json({
      success: true,
      count: filteredAvailability.length,
      data: filteredAvailability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching availability'
    });
  }
});

// @route   POST /api/availability
// @desc    Create or update instructor availability for a specific date
// @access  Private (Instructor only)
router.post('/', protect, restrictTo('instructor'), async (req, res) => {
  try {
    const { date, timeSlots, enabled } = req.body;
    const instructorId = req.user._id;

    // Check if availability already exists for this date
    let availability = await Availability.findOne({
      instructorId,
      date: new Date(date)
    });

    if (availability) {
      // Update existing availability
      availability.timeSlots = timeSlots || availability.timeSlots;
      availability.enabled = enabled !== undefined ? enabled : availability.enabled;
      await availability.save();
    } else {
      // Create new availability
      availability = await Availability.create({
        instructorId,
        date: new Date(date),
        timeSlots: timeSlots || Availability.generateDefaultTimeSlots(),
        enabled: enabled !== undefined ? enabled : true
      });
    }

    res.status(201).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error creating/updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while managing availability'
    });
  }
});

// @route   PUT /api/availability/:id/timeslot
// @desc    Update a specific time slot (book/cancel)
// @access  Private
router.put('/:id/timeslot', protect, async (req, res) => {
  try {
    const { time, available, bookingId } = req.body;

    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }

    const slot = availability.timeSlots.find(s => s.time === time);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    slot.available = available;
    if (bookingId) {
      slot.bookingId = bookingId;
    } else {
      slot.bookingId = null;
    }

    await availability.save();

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating time slot'
    });
  }
});

// @route   POST /api/availability/bulk
// @desc    Bulk create availability for multiple dates (instructor setup)
// @access  Private (Instructor only)
router.post('/bulk', protect, restrictTo('instructor'), async (req, res) => {
  try {
    const { startDate, endDate, timeSlots, daysOfWeek } = req.body;
    const instructorId = req.user._id;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const availabilityDocs = [];

    // Generate availability for each day in the range
    // Use UTC to avoid timezone issues
    for (let date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 12, 0, 0)); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

      // If daysOfWeek is specified, only create for those days
      if (!daysOfWeek || daysOfWeek.includes(dayOfWeek)) {
        // Check if availability already exists
        const existing = await Availability.findOne({
          instructorId,
          date: new Date(date)
        });

        if (!existing) {
          availabilityDocs.push({
            instructorId,
            date: new Date(date),
            timeSlots: timeSlots || Availability.generateDefaultTimeSlots(),
            enabled: true
          });
        }
      }
    }

    if (availabilityDocs.length > 0) {
      await Availability.insertMany(availabilityDocs);
    }

    res.status(201).json({
      success: true,
      message: `Created availability for ${availabilityDocs.length} days`,
      count: availabilityDocs.length
    });
  } catch (error) {
    console.error('Error bulk creating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk creating availability'
    });
  }
});

// @route   DELETE /api/availability/:id
// @desc    Delete availability for a specific date
// @access  Private (Instructor only)
router.delete('/:id', protect, restrictTo('instructor'), async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }

    // Check if user owns this availability
    if (availability.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this availability'
      });
    }

    await availability.deleteOne();

    res.json({
      success: true,
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting availability'
    });
  }
});

module.exports = router;
