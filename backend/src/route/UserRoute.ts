import { Router, Request, Response } from 'express';
import { UserRepository } from '../repository/UserRepository';
import { CreateUserRequest } from '../model/mysql/User';
import { mysqlPool } from '../config/database';

const router = Router();
const userRepository = new UserRepository();

// GET /api/users - Lấy tất cả users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await userRepository.findAll();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error: any) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/users/:id - Lấy user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const user = await userRepository.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/users - Tạo user mới
router.post('/users', async (req: Request, res: Response) => {
  try {
    const userData: CreateUserRequest = req.body;
    console.log("create user data: ", userData)
    // Basic validation
    if (!userData.username || !userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email and password are required'
      });
    }

    if (userData.password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const newUser = await userRepository.create(userData);
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Health check endpoint cho database
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const [result] = await mysqlPool.execute('SELECT 1 as test');
    
    res.json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
      database: process.env.MYSQL_DATABASE
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Thêm endpoint để lấy danh sách games
router.get('/games', async (req: Request, res: Response) => {
  try {
    const [games] = await mysqlPool.execute('SELECT * FROM games');
    
    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
});

export default router;