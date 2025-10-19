import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // 1. Throw an error if the MONGO_URI is missing.
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable not set");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    // 2. Log the HOST and the DATABASE NAME for clarity.
    console.log(
      `MongoDB Connected: Host -> ${conn.connection.host}, DB -> ${conn.connection.name}`
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
