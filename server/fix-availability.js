const mongoose = require('mongoose');
const Instructor = require('./src/models/Instructor');
const Availability = require('./src/models/Availability');
const dotenv = require('dotenv');

dotenv.config();

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

const generateAvailability = async () => {
    try {
        const mongoUri = 'mongodb://mongo:Sathwik123@roundhouse.proxy.rlwy.net:47714/test';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const instructors = await Instructor.find({});
        console.log(`Found ${instructors.length} instructors`);

        for (const instructor of instructors) {
            if (!instructor.openingHours) {
                console.log(`Skipping instructor ${instructor._id} (no opening hours)`);
                continue;
            }

            console.log(`Generating availability for instructor ${instructor.user} (${instructor._id})...`);

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

            let count = 0;

            for (let i = 0; i < 60; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dayOfWeek = date.getDay();

                // Find which day name matches this day of week
                const dayName = Object.keys(dayMap).find(name => dayMap[name] === dayOfWeek);
                const hoursForDay = instructor.openingHours[dayName] || [];

                // Skip if no hours defined for this day
                if (hoursForDay.length === 0) continue;

                // Generate time slots based on opening hours
                const timeSlots = [];
                hoursForDay.forEach(hourRange => {
                    if (hourRange.start && hourRange.end) {
                        const startHour = parseTime(hourRange.start);
                        const endHour = parseTime(hourRange.end);

                        for (let hour = startHour; hour < endHour; hour++) {
                            const timeStr = formatHour(hour);
                            timeSlots.push({ time: timeStr, available: true });
                        }
                    }
                });

                if (timeSlots.length > 0) {
                    await Availability.findOneAndUpdate(
                        { instructorId: instructor.user, date },
                        { instructorId: instructor.user, date, timeSlots, enabled: true },
                        { upsert: true, new: true }
                    );
                    count++;
                }
            }
            console.log(`✅ Generated ${count} days of availability for instructor ${instructor.user}`);
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

generateAvailability();
