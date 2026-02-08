const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Instructor = require('../models/Instructor');
const Availability = require('../models/Availability');

const seedAvailabilityFromOpeningHours = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all active instructors with opening hours
    const instructors = await Instructor.find({ status: 'active' });

    for (const instructor of instructors) {
      if (!instructor.openingHours) {
        console.log(`Skipping ${instructor._id} - no opening hours`);
        continue;
      }

      console.log(`Processing instructor: ${instructor._id}`);

      // Generate availability for next 60 days
      // Use UTC consistently to avoid timezone mismatches between server and client
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));

      for (let i = 0; i < 60; i++) {
        const date = new Date(todayUTC.getTime() + i * 24 * 60 * 60 * 1000);

        // Get day name (monday, tuesday, etc.)
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getUTCDay()];

        // Get opening hours for this day
        const dayHours = instructor.openingHours[dayName] || [];

        if (dayHours.length === 0) {
          // Day is closed - skip
          continue;
        }

        // Check if availability already exists for this date
        const existing = await Availability.findOne({
          instructorId: instructor._id,
          date: date
        });

        if (existing) {
          console.log(`  Skipping ${date.toISOString().split('T')[0]} - already exists`);
          continue;
        }

        // Generate time slots from opening hours
        const timeSlots = [];

        for (const hours of dayHours) {
          if (!hours.startTime || !hours.endTime) continue;

          // Parse start and end times
          const [startHour, startMin] = hours.startTime.split(':').map(Number);
          const [endHour, endMin] = hours.endTime.split(':').map(Number);

          // Generate hourly slots
          let currentHour = startHour;
          let currentMin = startMin;

          while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            // Format time as "9:00 AM" or "2:00 PM"
            const period = currentHour >= 12 ? 'PM' : 'AM';
            const displayHour = currentHour > 12 ? currentHour - 12 : (currentHour === 0 ? 12 : currentHour);
            const timeString = `${displayHour}:${currentMin.toString().padStart(2, '0')} ${period}`;

            timeSlots.push({
              time: timeString,
              available: true,
              booking: null
            });

            // Move to next hour
            currentMin += 60;
            if (currentMin >= 60) {
              currentMin = 0;
              currentHour += 1;
            }
          }
        }

        if (timeSlots.length === 0) {
          continue;
        }

        // Create availability record
        await Availability.create({
          instructorId: instructor._id,
          date: date,
          timeSlots: timeSlots,
          enabled: true
        });

        console.log(`  Created availability for ${date.toISOString().split('T')[0]} with ${timeSlots.length} slots`);
      }
    }

    console.log('\n✅ Availability seeded successfully');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedAvailabilityFromOpeningHours();
