import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Config
dotenv.config();

// Database
import { initializeDatabase } from './config/Database';

// Routes
import userRoutes from './route/UserRoute';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', userRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.json({
    message: 'MyBoardGame API Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.MYSQL_DATABASE || 'myboardgame'
  });
});

// Khởi động server
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting MyBoardGame Server...');
    console.log('🔧 Initializing database...');
    
    // Khởi tạo database và tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.MYSQL_DATABASE}`);
      console.log('🎮 MyBoardGame API ready to use!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Xử lý graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

export default app;