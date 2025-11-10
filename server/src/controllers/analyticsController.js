const Booking = require('../models/Booking');
const Instructor = require('../models/Instructor');
const moment = require('moment');

// @desc    Get instructor analytics
// @route   GET /api/analytics/instructor/:instructorId
// @access  Private (Instructor)
exports.getInstructorAnalytics = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Try to find instructor profile by user ID or instructor ID
    let instructor = await Instructor.findOne({ user: instructorId });
    if (!instructor) {
      instructor = await Instructor.findById(instructorId);
    }

    const instructorIdToUse = instructor ? instructor._id : instructorId;

    // Get all bookings for this instructor
    const bookings = await Booking.find({
      instructor: instructorIdToUse
    }).populate('learner', 'firstName lastName phone email');

    // Calculate analytics
    const now = moment();
    const last90Days = moment().subtract(90, 'days');
    const financialYearStart = moment().month() >= 6
      ? moment().month(6).date(1).startOf('day')  // July 1st
      : moment().subtract(1, 'year').month(6).date(1).startOf('day');

    // Earnings calculations
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const upcomingBookings = bookings.filter(b =>
      b.status === 'confirmed' && moment(b.lesson.date).isAfter(now)
    );

    const calculateEarnings = (bookings) => {
      return bookings.reduce((total, booking) => {
        const rate = instructor?.pricing?.marketplaceLessonRate || 82;
        return total + (booking.lesson.duration * rate);
      }, 0);
    };

    const allTimeEarnings = calculateEarnings(completedBookings);
    const fytdBookings = completedBookings.filter(b =>
      moment(b.lesson.date).isAfter(financialYearStart)
    );
    const fytdEarnings = calculateEarnings(fytdBookings);
    const upcomingEarnings = calculateEarnings(upcomingBookings);

    // Last 90 days earnings
    const last90DaysBookings = completedBookings.filter(b =>
      moment(b.lesson.date).isAfter(last90Days)
    );
    const last90DaysHours = last90DaysBookings.reduce((sum, b) => sum + (b.lesson.duration || 0), 0);
    const last90DaysEarnings = calculateEarnings(last90DaysBookings);
    const aveWeeklyEarnings = last90DaysEarnings / (90 / 7);
    const aveEarningsPerHour = last90DaysHours > 0 ? last90DaysEarnings / last90DaysHours : 0;

    // Cancellation rate (last 90 days)
    const last90DaysAllBookings = bookings.filter(b =>
      moment(b.lesson.date).isAfter(last90Days)
    );
    const cancelled = last90DaysAllBookings.filter(b => b.status === 'cancelled').length;
    const cancellationRate = last90DaysAllBookings.length > 0
      ? (cancelled / last90DaysAllBookings.length) * 100
      : 0;

    // Booking hours per learner (excluding new learners within 90 days)
    const learnersMap = new Map();
    bookings.forEach(booking => {
      if (!booking.learner) return;
      const learnerId = booking.learner._id.toString();

      if (!learnersMap.has(learnerId)) {
        learnersMap.set(learnerId, {
          firstBooking: moment(booking.createdAt),
          totalHours: 0
        });
      }

      const learnerData = learnersMap.get(learnerId);
      if (booking.status === 'completed') {
        learnerData.totalHours += booking.lesson.duration || 0;
      }
    });

    // Filter out new learners (within 90 days)
    const establishedLearners = Array.from(learnersMap.values()).filter(l =>
      l.firstBooking.isBefore(last90Days)
    );

    const totalHoursEstablished = establishedLearners.reduce((sum, l) => sum + l.totalHours, 0);
    const bookingHoursPerLearner = establishedLearners.length > 0
      ? totalHoursEstablished / establishedLearners.length
      : 0;

    // Learner rating (placeholder - would come from reviews)
    const learnerRating = 5.0;

    // Monthly earnings for chart (last 12 months)
    const monthlyEarnings = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = moment().subtract(i, 'months').startOf('month');
      const monthEnd = moment().subtract(i, 'months').endOf('month');

      const monthBookings = completedBookings.filter(b =>
        moment(b.lesson.date).isBetween(monthStart, monthEnd, null, '[]')
      );

      monthlyEarnings.push({
        month: monthStart.format('MMM YYYY'),
        earnings: calculateEarnings(monthBookings)
      });
    }

    // Previous payout (last completed booking week)
    const lastWeekStart = moment().subtract(1, 'week').startOf('week');
    const lastWeekEnd = moment().subtract(1, 'week').endOf('week');
    const lastWeekBookings = completedBookings.filter(b =>
      moment(b.lesson.date).isBetween(lastWeekStart, lastWeekEnd, null, '[]')
    );
    const previousPayout = calculateEarnings(lastWeekBookings);

    // Next payout (current week)
    const thisWeekStart = moment().startOf('week');
    const thisWeekEnd = moment().endOf('week');
    const thisWeekBookings = completedBookings.filter(b =>
      moment(b.lesson.date).isBetween(thisWeekStart, thisWeekEnd, null, '[]')
    );
    const nextPayout = calculateEarnings(thisWeekBookings);

    // Booking activity
    const totalBookingHours = completedBookings.reduce((sum, b) => sum + (b.lesson.duration || 0), 0);
    const uniqueLearners = learnersMap.size;
    const upcomingHours = upcomingBookings.reduce((sum, b) => sum + (b.lesson.duration || 0), 0);
    const completedHours = totalBookingHours;
    const testPackages = 0; // Placeholder
    const searchesInArea = 32100; // Placeholder

    // Credits held by learners (placeholder)
    const creditsHeld = 591.00;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          earnings: {
            allTime: allTimeEarnings,
            fytd: fytdEarnings,
            upcoming: upcomingEarnings,
            aveWeekly: aveWeeklyEarnings,
            avePerHour: aveEarningsPerHour,
            nextPayout: nextPayout,
            previousPayout: previousPayout,
            creditsHeld: creditsHeld
          },
          metrics: {
            cancellationRate: cancellationRate,
            bookingHoursPerLearner: bookingHoursPerLearner,
            learnerRating: learnerRating
          },
          activity: {
            searchesInArea: searchesInArea,
            testPackages: testPackages,
            totalBookingHours: totalBookingHours,
            learners: uniqueLearners,
            upcomingHours: upcomingHours,
            completedHours: completedHours
          },
          chart: {
            monthlyEarnings: monthlyEarnings
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};
