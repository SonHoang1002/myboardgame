import { Router, Request, Response } from 'express';
import { UserRepository } from '../repository/user.repository';
import { verifyToken } from '../middleware/validation';
import { STATUS_BAD_REQUEST_400, STATUS_CONFLICT_409, STATUS_CREATED_201, STATUS_FORBIDDEN_403, STATUS_INTERNAL_SERVER_ERROR_500, STATUS_NOT_FOUND_404, STATUS_OK_200, STATUS_UNAUTHORIZED_401 } from '../constant/common';
import { User } from '../model/User';
import { generateUID, generateUserUID } from '../util/GenerationUID';


const userRouters = Router();
const userRepository = new UserRepository();

// Public routes ------------------------------------------------------

/**
 * @route GET /api/users
 * @desc Lấy danh sách users với filter và pagination
 * @access Public
 */
userRouters.get("/", async (req: Request, res: Response) => {
    try {
        const query = req.query;
        const page = query.page ? parseInt(query.page as string) : 1;
        const limit = query.limit ? parseInt(query.limit as string) : 50;
        const status = query.status ? parseInt(query.status as string) : undefined;
        const minLevel = query.minLevel ? parseInt(query.minLevel as string) : undefined;
        const maxLevel = query.maxLevel ? parseInt(query.maxLevel as string) : undefined;
        const searchTerm = query.searchTerm as string | undefined;
        const sortBy = query.sortBy as string | undefined;
        const sortOrder = query.sortOrder as 'ASC' | 'DESC' | undefined;

        console.log("Get users query:", {
            page, limit, status, minLevel, maxLevel, searchTerm, sortBy, sortOrder
        });

        const filters = {
            status,
            minLevel,
            maxLevel,
            searchTerm,
            limit,
            page,
            sortBy,
            sortOrder
        };

        const result = await userRepository.getAllUsers(filters);

        res.status(STATUS_OK_200).json({
            success: true,
            data: {
                users: result.users,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                    hasNext: result.page < result.totalPages,
                    hasPrev: result.page > 1
                }
            }
        });
    } catch (error: any) {
        console.error('Error getting users:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/search
 * @desc Tìm kiếm users
 * @access Public
 */
userRouters.get("/search", async (req: Request, res: Response) => {
    try {
        const query = req.query;
        const searchTerm = query.q as string;
        const limit = query.limit ? parseInt(query.limit as string) : 20;

        console.log("Search users:", { searchTerm, limit });

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Search term is required'
            });
        }

        const users = await userRepository.searchUsers(searchTerm, limit);

        res.status(STATUS_OK_200).json({
            success: true,
            data: users
        });
    } catch (error: any) {
        console.error('Error searching users:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/online
 * @desc Lấy danh sách users đang online
 * @access Public
 */
userRouters.get("/online", async (req: Request, res: Response) => {
    try {
        console.log("Get online users");

        const users = await userRepository.getOnlineUsers();

        res.status(STATUS_OK_200).json({
            success: true,
            data: users
        });
    } catch (error: any) {
        console.error('Error getting online users:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/top-players
 * @desc Lấy top players
 * @access Public
 */
userRouters.get("/top-players", async (req: Request, res: Response) => {
    try {
        const query = req.query;
        const limit = query.limit ? parseInt(query.limit as string) : 10;
        const by = query.by as 'level' | 'wins' | 'exp' || 'level';

        console.log("Get top players:", { limit, by });

        const users = await userRepository.getTopPlayers(limit, by);

        res.status(STATUS_OK_200).json({
            success: true,
            data: users
        });
    } catch (error: any) {
        console.error('Error getting top players:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/statistics
 * @desc Lấy thống kê users
 * @access Public
 */
userRouters.get("/statistics", async (req: Request, res: Response) => {
    try {
        console.log("Get user statistics");

        const stats = await userRepository.getUserStatistics();

        res.status(STATUS_OK_200).json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Error getting user statistics:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/login/:loginId
 * @desc Lấy user bằng login ID
 * @access Public
 */
userRouters.get("/login/:loginId", async (req: Request, res: Response) => {
    try {
        const loginId = parseInt(req.params.loginId);

        console.log("Get user by loginId:", { loginId });

        if (!loginId || isNaN(loginId)) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Valid login ID is required'
            });
        }

        const user = await userRepository.findByLoginId(loginId);

        if (!user) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Error getting user by loginId:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/uid/:uid
 * @desc Lấy user bằng UID
 * @access Public
 */
userRouters.get("/uid/:uid", async (req: Request, res: Response) => {
    try {
        const uid = req.params.uid;

        console.log("Get user by UID:", { uid });

        if (!uid || uid.trim() === '') {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'UID is required'
            });
        }

        const user = await userRepository.findByUid(uid);

        if (!user) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Error getting user by UID:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route GET /api/users/health/db
 * @desc Kiểm tra kết nối database
 * @access Public
 */
userRouters.get("/health/db", async (req: Request, res: Response) => {
    try {
        console.log("Check database connection");

        const result = await userRepository.testConnection();

        res.status(STATUS_OK_200).json({
            success: true,
            data: result,
            message: 'Database connection successful'
        });
    } catch (error: any) {
        console.error('Database connection error:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Database connection failed'
        });
    }
});

// Protected routes (require authentication) --------------------------

/**
 * @route GET /api/users/profile
 * @desc Lấy profile của user hiện tại
 * @access Private
 */
userRouters.get("/profile", verifyToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        console.log("Get user profile:", { userId });

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const user = await userRepository.findById(userId);

        if (!user) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Error getting user profile:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route POST /api/users
 * @desc Tạo user mới
 * @access Private
 */
userRouters.post("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const nameInGame = body.nameInGame;
        const loginId = body.loginId;
        const uid = body.uid;
        const status = body.status;
        const location = body.location;
        const avatarUrl = body.avatarUrl;
        const phone = body.phone;
        const bio = body.bio;
        const totalGamesPlayed = body.totalGamesPlayed;
        const totalGamesWon = body.totalGamesWon;
        const experiencePoints = body.experiencePoints;
        const level = body.level;

        console.log("Create user body:", {
            nameInGame, loginId, uid, status, location, avatarUrl,
            phone, bio, totalGamesPlayed, totalGamesWon, experiencePoints, level
        });

        // Kiểm tra thông tin bắt buộc
        if (!nameInGame || !loginId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Name in game and login ID are required'
            });
        }

        const userData: User = {
            nameInGame,
            loginId,
            uid: uid || generateUserUID(),
            status: status || 0,
            location: location || null,
            avatarUrl: avatarUrl || 'https://static.vecteezy.com/system/resources/previews/036/280/651/original/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg',
            phone: phone || null,
            bio: bio || null,
            totalGamesPlayed: totalGamesPlayed || 0,
            totalGamesWon: totalGamesWon || 0,
            experiencePoints: experiencePoints || 0,
            level: level || 1,
            lastSeenAt: new Date()
        };

        const newUser = await userRepository.createUser(userData);

        res.status(STATUS_CREATED_201).json({
            success: true,
            data: newUser,
            message: 'User created successfully'
        });
    } catch (error: any) {
        console.error('Error creating user:', error);

        if (error.message.includes('already exists')) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: error.message
            });
        }

        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

userRouters.patch("/update", verifyToken, async (req: Request, res: Response) => {
    try {
        const body = req.body;
        console.log("user/update body: ", body);

        // Chỉ lấy các trường có thể update
        const updateData: Partial<User> = {};
        const userId = body.id;
        // Các trường có thể update
        if (body.nameInGame !== undefined) updateData.nameInGame = body.nameInGame;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.bio !== undefined) updateData.bio = body.bio;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.status !== undefined) updateData.status = body.status;

        console.log("Update user data for userId:", userId, "data:", updateData);

        // Kiểm tra user tồn tại
        const existingUser = await userRepository.findById(userId);
        if (!existingUser) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Kiểm tra nameInGame không trùng (nếu có update)
        if (updateData.nameInGame && updateData.nameInGame !== existingUser.nameInGame) {
            const userWithSameName = await userRepository.getUserByNameInGame(updateData!.nameInGame);
            if (userWithSameName && userWithSameName.id !== userId) {
                return res.status(STATUS_BAD_REQUEST_400).json({
                    success: false,
                    error: 'Name in game already exists'
                });
            }
        }

        // Cập nhật thời gian lastSeenAt
        updateData.lastSeenAt = new Date();

        // Thực hiện update
        const updatedUser = await userRepository.updateUser(userId, updateData);

        res.status(STATUS_OK_200).json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating user:', error);

        if (error.message.includes('already exists')) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: error.message
            });
        }

        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route PUT /api/users/profile
 * @desc Cập nhật profile của user hiện tại
 * @access Private
 */
userRouters.put("/profile", verifyToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const body = req.body;

        console.log("Update user profile:", { userId, body });

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const updates: Partial<User> = {};

        // Chỉ cập nhật các field được cung cấp
        if (body.nameInGame !== undefined) updates.nameInGame = body.nameInGame;
        if (body.uid !== undefined) updates.uid = body.uid;
        if (body.location !== undefined) updates.location = body.location;
        if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.bio !== undefined) updates.bio = body.bio;

        const user = await userRepository.updateUser(userId, updates);

        if (!user) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: user,
            message: 'Profile updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating user profile:', error);

        if (error.message.includes('already exists')) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: error.message
            });
        }

        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route PATCH /api/users/status
 * @desc Cập nhật trạng thái user
 * @access Private
 */
userRouters.patch("/status", verifyToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const body = req.body;
        const status = body.status;
        const location = body.location;

        console.log("Update user status:", { userId, status, location });

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        if (status === undefined || status < 0 || status > 3) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Valid status (0-3) is required'
            });
        }

        const success = await userRepository.updateUserStatus(userId, status);

        // Nếu có location, cập nhật location riêng
        if (location !== undefined) {
            await userRepository.updateUser(userId, { location });
        }

        if (!success) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Lấy thông tin user cập nhật
        const user = await userRepository.findById(userId);

        res.status(STATUS_OK_200).json({
            success: true,
            data: user,
            message: 'Status updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating user status:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route PATCH /api/users/last-seen
 * @desc Cập nhật last seen
 * @access Private
 */
userRouters.patch("/last-seen", verifyToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        console.log("Update last seen:", { userId });

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const success = await userRepository.updateLastSeen(userId);

        if (!success) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            message: 'Last seen updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating last seen:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route PATCH /api/users/experience
 * @desc Thêm kinh nghiệm cho user
 * @access Private
 */
userRouters.patch("/experience", verifyToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const body = req.body;
        const exp = body.exp;

        console.log("Add experience:", { userId, exp });

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        if (!exp || exp <= 0) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Valid experience points are required'
            });
        }

        const result = await userRepository.addExperience(userId, exp);

        res.status(STATUS_OK_200).json({
            success: true,
            data: result,
            message: `Added ${exp} experience points`
        });
    } catch (error: any) {
        console.error('Error adding experience:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route PATCH /api/users/games-played
 * @desc Tăng số game đã chơi
 * @access Private
 */
userRouters.patch("/games-played", verifyToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const body = req.body;
        const won = body.won || false;

        console.log("Increment games played:", { userId, won });

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        await userRepository.incrementGamesPlayed(userId, won);

        // Lấy thông tin user cập nhật
        const user = await userRepository.findById(userId);

        res.status(STATUS_OK_200).json({
            success: true,
            data: {
                totalGamesPlayed: user?.totalGamesPlayed,
                totalGamesWon: user?.totalGamesWon
            },
            message: `Game ${won ? 'won' : 'played'} recorded`
        });
    } catch (error: any) {
        console.error('Error incrementing games played:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Admin routes ------------------------------------------------------

/**
 * @route GET /api/users/:id
 * @desc Lấy user bằng ID (admin)
 * @access Private (Admin)
 */
userRouters.get("/:id", verifyToken, async (req: any, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log("Get user by ID (admin):", { id, userId, userRole });

        if (!userId || !id) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID and target ID are required'
            });
        }

        // Kiểm tra quyền admin (hoặc chính user đó)
        if (userRole !== 'admin' && userId !== id) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: 'You do not have permission to view this user'
            });
        }

        const user = await userRepository.findById(id);

        if (!user) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Error getting user by ID:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route PUT /api/users/:id
 * @desc Cập nhật user (admin)
 * @access Private (Admin)
 */
userRouters.put("/:id", verifyToken, async (req: any, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;
        const body = req.body;

        console.log("Update user by ID (admin):", { id, userId, userRole, body });

        if (!userId || !id) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID and target ID are required'
            });
        }

        // Chỉ admin mới có quyền cập nhật user khác
        if (userRole !== 'admin' && userId !== id) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: 'You do not have permission to update this user'
            });
        }

        const updates: Partial<User> = {};

        // Cho phép cập nhật nhiều field hơn nếu là admin hoặc chính user đó
        if (body.nameInGame !== undefined) updates.nameInGame = body.nameInGame;
        if (body.uid !== undefined) updates.uid = body.uid;
        if (body.status !== undefined) updates.status = body.status;
        if (body.location !== undefined) updates.location = body.location;
        if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.bio !== undefined) updates.bio = body.bio;
        if (body.totalGamesPlayed !== undefined) updates.totalGamesPlayed = body.totalGamesPlayed;
        if (body.totalGamesWon !== undefined) updates.totalGamesWon = body.totalGamesWon;
        if (body.experiencePoints !== undefined) updates.experiencePoints = body.experiencePoints;
        if (body.level !== undefined) updates.level = body.level;
        if (body.loginId !== undefined) updates.loginId = body.loginId;

        const user = await userRepository.updateUser(id, updates);

        if (!user) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating user by ID:', error);

        if (error.message.includes('already exists')) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: error.message
            });
        }

        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * @route DELETE /api/users/:id
 * @desc Xóa user (admin)
 * @access Private (Admin)
 */
userRouters.delete("/:id", verifyToken, async (req: any, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log("Delete user by ID (admin):", { id, userId, userRole });

        if (!userId || !id) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'User ID and target ID are required'
            });
        }

        // Chỉ admin mới có quyền xóa user
        if (userRole !== 'admin') {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: 'You do not have permission to delete users'
            });
        }

        // Không cho phép xóa chính mình
        if (userId === id) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'You cannot delete your own account'
            });
        }

        const success = await userRepository.deleteUser(id);

        if (!success) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

export default userRouters;