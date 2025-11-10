require('dotenv').config();
const mongoose = require('mongoose');
const Instructor = require('../models/Instructor');

const activateAllInstructors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all instructors with pending status to active
    const result = await Instructor.updateMany(
      { status: 'pending' },
      { $set: { status: 'active', marketplaceVisible: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} instructors to active status`);

    // List all instructors
    const instructors = await Instructor.find()
      .populate('user', 'firstName lastName email')
      .select('user status marketplaceVisible serviceArea');

    console.log('\n📋 All Instructors:');
    instructors.forEach(instructor => {
      const name = instructor.user
        ? `${instructor.user.firstName} ${instructor.user.lastName}`
        : 'Unknown';
      const suburbs = instructor.serviceArea?.suburbs?.join(', ') || 'None';
      console.log(`  - ${name}: status=${instructor.status}, visible=${instructor.marketplaceVisible}, suburbs=[${suburbs}]`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

activateAllInstructors();
