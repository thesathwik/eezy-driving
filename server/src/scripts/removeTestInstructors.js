const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Availability = require('../models/Availability');

const removeTestInstructors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test instructor emails
    const testEmails = [
      'rana@eazydriving.com',
      'lee@eazydriving.com',
      'carl@eazydriving.com',
      'eric@eazydriving.com'
    ];

    console.log('🔍 Finding test instructors...\n');

    for (const email of testEmails) {
      // Find user
      const user = await User.findOne({ email });

      if (user) {
        console.log(`📝 Found user: ${user.firstName} ${user.lastName} (${email})`);

        // Find instructor profile
        const instructor = await Instructor.findOne({ user: user._id });

        if (instructor) {
          console.log(`   👤 Found instructor profile: ${instructor._id}`);

          // Delete associated availability
          const availabilityCount = await Availability.deleteMany({ instructorId: instructor._id });
          console.log(`   🗑️  Deleted ${availabilityCount.deletedCount} availability records`);

          // Delete instructor profile
          await Instructor.deleteOne({ _id: instructor._id });
          console.log(`   ✅ Deleted instructor profile`);
        }

        // Delete user
        await User.deleteOne({ _id: user._id });
        console.log(`   ✅ Deleted user account\n`);
      } else {
        console.log(`   ⚠️  User not found: ${email}\n`);
      }
    }

    console.log('✅ Test instructors removed successfully!');

    // Show remaining instructors
    const remainingInstructors = await Instructor.find().populate('user', 'firstName lastName email');
    console.log(`\n📊 Remaining instructors: ${remainingInstructors.length}`);
    remainingInstructors.forEach(inst => {
      console.log(`   - ${inst.user?.firstName} ${inst.user?.lastName} (${inst.user?.email})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

removeTestInstructors();
