const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MDB_URI || process.env.MONGODB_URI;
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 Using URI variable:', process.env.MDB_URI ? 'MDB_URI' : 'MONGODB_URI');

    if (!uri) {
      console.error('❌ No MongoDB URI found! Set MDB_URI or MONGODB_URI environment variable.');
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
