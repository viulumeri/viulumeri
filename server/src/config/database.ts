import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.NODE_ENV === 'development' 
      ? 'mongodb://admin:password@localhost:27017/viulumeri?authSource=admin'
      : process.env.MONGODB_URI || '';

    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;