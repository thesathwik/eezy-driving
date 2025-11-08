require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Availability = require('../models/Availability');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const generateTimeSlots = () => {
  const times = [
    '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  return times.map(time => ({
    time,
    available: Math.random() > 0.3, // 70% available, 30% booked
    bookingId: null
  }));
};

const seedInstructors = async () => {
  try {
    console.log('🌱 Starting to seed instructors and availability...\n');

    // Sample instructors data
    const instructorsData = [
      {
        firstName: 'Rana',
        lastName: 'Singh',
        email: 'rana@eazydriving.com',
        phone: '0412345678',
        password: 'password123',
        role: 'instructor',
        suburb: 'Springfield Lakes',
        postcode: '4300'
      },
      {
        firstName: 'Lee',
        lastName: 'Chen',
        email: 'lee@eazydriving.com',
        phone: '0423456789',
        password: 'password123',
        role: 'instructor',
        suburb: 'Ipswich',
        postcode: '4305'
      },
      {
        firstName: 'Carl',
        lastName: 'Johnson',
        email: 'carl@eazydriving.com',
        phone: '0434567890',
        password: 'password123',
        role: 'instructor',
        suburb: 'Brookwater',
        postcode: '4300'
      },
      {
        firstName: 'Eric',
        lastName: 'Williams',
        email: 'eric@eazydriving.com',
        phone: '0445678901',
        password: 'password123',
        role: 'instructor',
        suburb: 'Augustine Heights',
        postcode: '4300'
      }
    ];

    // Create or update users
    for (const instructorData of instructorsData) {
      console.log(`📝 Processing instructor: ${instructorData.firstName} ${instructorData.lastName}`);

      // Check if user exists
      let user = await User.findOne({ email: instructorData.email });

      if (!user) {
        // Create new user
        user = await User.create({
          firstName: instructorData.firstName,
          lastName: instructorData.lastName,
          email: instructorData.email,
          phone: instructorData.phone,
          password: instructorData.password,
          role: instructorData.role,
          isEmailVerified: true,
          isPhoneVerified: true,
          isProfileComplete: true
        });
        console.log(`   ✅ User created: ${user.email}`);
      } else {
        console.log(`   ℹ️  User already exists: ${user.email}`);
      }

      // Check if instructor profile exists
      let instructor = await Instructor.findOne({ user: user._id });

      if (!instructor) {
        // Create instructor profile
        instructor = await Instructor.create({
          user: user._id,
          gender: 'male',
          postcode: instructorData.postcode,
          bio: `Experienced driving instructor specializing in helping learners build confidence and pass their test on the first try.`,
          languages: ['English'],
          memberOfAssociation: true,
          instructingSince: {
            month: 'January',
            year: new Date().getFullYear() - Math.floor(Math.random() * 10)
          },
          services: ['Driving test package: existing customers', 'Driving test package: new customers'],
          vehicle: {
            transmissionOffered: 'auto',
            transmission: 'auto',
            registration: 'ABC' + Math.floor(Math.random() * 1000),
            make: 'Toyota',
            model: 'Corolla',
            year: 2022,
            ancapRating: '5 Stars',
            hasDualControls: true
          },
          serviceArea: {
            suburbs: [instructorData.suburb],
            testLocations: ['Ipswich Test Centre']
          },
          openingHours: {
            monday: [{ startTime: '08:00', endTime: '17:00' }],
            tuesday: [{ startTime: '08:00', endTime: '17:00' }],
            wednesday: [{ startTime: '08:00', endTime: '17:00' }],
            thursday: [{ startTime: '08:00', endTime: '17:00' }],
            friday: [{ startTime: '08:00', endTime: '17:00' }],
            saturday: [{ startTime: '09:00', endTime: '15:00' }],
            sunday: []
          },
          pricing: {
            marketplaceLessonRate: 60 + Math.floor(Math.random() * 10),
            privateLessonRate: 65 + Math.floor(Math.random() * 10),
            marketplaceTestPackageRate: 150,
            privateTestPackageRate: 180
          },
          banking: {
            businessName: `${instructorData.firstName} Driving School`,
            abn: '12345678901',
            billingAddress: {
              street: '123 Main Street',
              suburb: instructorData.suburb,
              postcode: instructorData.postcode,
              state: 'QLD'
            },
            registeredForGST: true,
            payoutFrequency: 'weekly',
            bankAccount: {
              accountName: `${instructorData.firstName} ${instructorData.lastName}`,
              bsb: '123456',
              accountNumber: '12345678'
            }
          },
          stats: {
            totalLessons: Math.floor(Math.random() * 500) + 50,
            totalStudents: Math.floor(Math.random() * 100) + 10,
            averageRating: 4.5 + Math.random() * 0.5,
            totalReviews: Math.floor(Math.random() * 200) + 10,
            passRate: 75 + Math.floor(Math.random() * 20)
          },
          verification: {
            isVerified: true,
            licenceVerified: true,
            backgroundCheckComplete: true,
            insuranceVerified: true,
            verifiedAt: new Date()
          },
          status: 'active',
          marketplaceVisible: true
        });
        console.log(`   ✅ Instructor profile created`);
      } else {
        console.log(`   ℹ️  Instructor profile already exists`);
      }

      // Delete existing availability for this instructor
      await Availability.deleteMany({ instructorId: user._id });
      console.log(`   🗑️  Cleared old availability data`);

      // Create availability for next 14 days
      const today = new Date();
      const availabilityDocs = [];

      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);

        // Skip Sundays
        if (date.getDay() === 0) continue;

        availabilityDocs.push({
          instructorId: user._id,
          date: date,
          timeSlots: generateTimeSlots(),
          enabled: true
        });
      }

      await Availability.insertMany(availabilityDocs);
      console.log(`   ✅ Created ${availabilityDocs.length} days of availability\n`);
    }

    console.log('✅ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Instructors: ${instructorsData.length}`);
    console.log(`   - Availability records: ~${instructorsData.length * 13} days`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the seeder
(async () => {
  await connectDB();
  await seedInstructors();
})();
