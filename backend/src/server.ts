import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3001;

// Connect to Database and Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();