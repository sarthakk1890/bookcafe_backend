import mongoose from "mongoose";

export const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI;
  
    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in the environment variables.");
    }
  
    const { connection } = await mongoose.connect(mongoURI);
    console.log(`Database is connected with ${connection.host}`);
  }