import { Router, Request, Response } from "express";
import { AuthRepository } from "../repository/auth.repository";
import { verifyToken } from "../middleware/validation";
import { encodePassword } from "../util/EncodeDecode";
import { UserLogin } from "../model/UserLogin";
import { STATUS_BAD_REQUEST_400, STATUS_CREATED_201, STATUS_FORBIDDEN_403, STATUS_FOUND_302, STATUS_INTERNAL_SERVER_ERROR_500, STATUS_NOT_FOUND_404, STATUS_OK_200, STATUS_UNAUTHORIZED_401 } from "../constant/common";
import { generateAccessToken, generateRefreshToken, verifyFreshToken } from "../util/TokenUtil";
import { TokenPayload } from "../type/token";
import { RoomRepository } from "../repository/room.repository";
import { Room } from "../model/Room";



const roomRouters = Router();
const roomRepository = new RoomRepository();

// Helper function để generate room ID
function generateRoomUID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ROOM-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function để validate room data
function validateRoomData(data: any): { isValid: boolean; errors: string[]; roomData: Partial<Room> } {
    const errors: string[] = [];
    const roomData: Partial<Room> = {};

    // Required fields
    if (!data.hostId) {
        errors.push('hostId is required');
    } else {
        roomData.hostId = data.hostId;
    }

    // Optional fields with validation
    if (data.roomName && data.roomName.length > 100) {
        errors.push('roomName must be less than 100 characters');
    } else if (data.roomName) {
        roomData.roomName = data.roomName;
    }

    if (data.maxPlayers && (data.maxPlayers < 2 || data.maxPlayers > 20)) {
        errors.push('maxPlayers must be between 2 and 20');
    } else if (data.maxPlayers) {
        roomData.maxPlayers = data.maxPlayers;
    }

    if (data.password && data.password.length > 100) {
        errors.push('password must be less than 100 characters');
    } else if (data.password) {
        roomData.password = data.password;
    }

    if (data.gameMode && data.gameMode.length > 50) {
        errors.push('gameMode must be less than 50 characters');
    } else if (data.gameMode) {
        roomData.gameMode = data.gameMode;
    }

    if (data.description) {
        roomData.description = data.description;
    }

    if (data.isPrivate !== undefined) {
        roomData.isPrivate = Boolean(data.isPrivate);
    }

    if (data.playerIds) {
        roomData.playerIds = Array.isArray(data.playerIds) ? data.playerIds : [];
    }

    if (data.gameSettings) {
        roomData.gameSettings = data.gameSettings;
    }

    if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt);
        if (isNaN(expiresAt.getTime())) {
            errors.push('expiresAt must be a valid date');
        } else {
            roomData.expiresAt = expiresAt;
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        roomData
    };
}

// 1. Tạo phòng mới
roomRouters.post("/create-room", async (req: Request, res: Response) => {
    try {
        const validation = validateRoomData(req.body);

        if (!validation.isValid) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                errors: validation.errors
            });
        }

        const roomData = validation.roomData;
        const { hostId } = roomData;

        if (!hostId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "hostId is required"
            });
        }

        // Kiểm tra host đã có trong phòng khác chưa
        const isHostInRoom = await roomRepository.isUserInRoom(hostId);
        if (isHostInRoom) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Host is already in another room"
            });
        }

        // Tạo room ID unique
        let roomId;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            roomId = generateRoomUID();
            const existingRoom = await roomRepository.findRoomByRoomId(roomId);
            if (!existingRoom) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to generate unique room ID"
            });
        }

        // Đảm bảo host luôn có trong player list
        const playerIds = roomData.playerIds || [];
        const allPlayerIds = [...new Set([hostId, ...playerIds])];

        const room: Room = {
            roomId: roomId!,
            hostId,
            playerIds: allPlayerIds,
            isUsing: true,
            roomName: roomData.roomName,
            description: roomData.description,
            maxPlayers: roomData.maxPlayers || 4,
            isPrivate: roomData.isPrivate || false,
            password: roomData.password,
            gameMode: roomData.gameMode || 'default',
            gameSettings: roomData.gameSettings,
            expiresAt: roomData.expiresAt
        };

        const newRoom = await roomRepository.createRoom(room);

        res.status(STATUS_CREATED_201).json({
            success: true,
            data: newRoom,
            message: 'Room created successfully',
        });
    } catch (error: any) {
        console.error('Error creating room:', error);

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

// 2. Lấy tất cả phòng (có thể filter)
roomRouters.get("/rooms", async (req: Request, res: Response) => {
    try {
        const {
            includeInactive,
            gameMode,
            isPrivate,
            minPlayers,
            maxPlayers,
            searchTerm,
            limit = '50',
            page = '1'
        } = req.query;

        const filters: any = {};

        if (includeInactive === 'true') {
            filters.includeInactive = true;
        }

        if (gameMode && typeof gameMode === 'string') {
            filters.gameMode = gameMode;
        }

        if (isPrivate !== undefined) {
            filters.isPrivate = isPrivate === 'true';
        }

        if (minPlayers && !isNaN(Number(minPlayers))) {
            filters.minPlayers = Number(minPlayers);
        }

        if (maxPlayers && !isNaN(Number(maxPlayers))) {
            filters.maxPlayers = Number(maxPlayers);
        }

        if (searchTerm && typeof searchTerm === 'string') {
            filters.searchTerm = searchTerm;
        }

        if (limit && !isNaN(Number(limit))) {
            filters.limit = Number(limit);
        }

        if (page && !isNaN(Number(page))) {
            filters.page = Number(page);
        }

        const result = await roomRepository.getAllRooms(filters);

        res.status(STATUS_OK_200).json({
            success: true,
            data: result,
            message: 'Rooms retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting rooms:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 3. Lấy phòng đang hoạt động
roomRouters.get("/rooms/active", async (req: Request, res: Response) => {
    try {
        const { maxPlayers } = req.query;

        let rooms;
        if (maxPlayers && !isNaN(Number(maxPlayers))) {
            // Lấy phòng có slot trống
            rooms = await roomRepository.findAvailableRooms(Number(maxPlayers));
        } else {
            // Lấy tất cả phòng đang hoạt động
            rooms = await roomRepository.getActiveRooms();
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: rooms,
            message: 'Active rooms retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting active rooms:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 4. Lấy thông tin phòng theo roomId
roomRouters.get("/room/:roomId", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;

        const room = await roomRepository.findRoomByRoomId(roomId);

        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'Room not found'
            });
        }

        // Cập nhật last activity
        await roomRepository.updateLastActivity(roomId);

        res.status(STATUS_OK_200).json({
            success: true,
            data: room,
            message: 'Room retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting room:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 5. Lấy thông tin phòng theo ID hệ thống
roomRouters.get("/room/id/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id, 10);

        if (isNaN(idNum)) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Invalid room ID'
            });
        }

        const room = await roomRepository.findRoomById(idNum);

        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: 'Room not found'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: room,
            message: 'Room retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting room by ID:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 6. Lấy phòng theo hostId
roomRouters.get("/host/:hostId/rooms", async (req: Request, res: Response) => {
    try {
        const { hostId } = req.params;

        const rooms = await roomRepository.findRoomsByHostId(hostId);

        res.status(STATUS_OK_200).json({
            success: true,
            data: rooms,
            message: 'Host rooms retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting host rooms:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 7. Lấy phòng theo playerId
roomRouters.get("/player/:playerId/rooms", async (req: Request, res: Response) => {
    try {
        const { playerId } = req.params;

        const rooms = await roomRepository.findRoomsByPlayerId(playerId);

        res.status(STATUS_OK_200).json({
            success: true,
            data: rooms,
            message: 'Player rooms retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting player rooms:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 8. Kiểm tra user có trong phòng nào không
roomRouters.get("/check-user/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { roomId } = req.query;

        let isInRoom;

        if (roomId && typeof roomId === 'string') {
            // Kiểm tra trong phòng cụ thể
            isInRoom = await roomRepository.isUserInSpecificRoom(userId, roomId);
        } else {
            // Kiểm tra trong bất kỳ phòng nào
            isInRoom = await roomRepository.isUserInRoom(userId);
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: {
                userId,
                isInRoom,
                ...(roomId && { roomId })
            },
            message: 'User room status checked successfully'
        });
    } catch (error: any) {
        console.error('Error checking user:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 9. Thêm player vào phòng (với password check nếu cần)
roomRouters.post("/room/:roomId/join", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { playerId, password } = req.body;

        if (!playerId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "playerId is required"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Kiểm tra phòng đang hoạt động
        if (!room.isUsing) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Room is not active"
            });
        }

        // Kiểm tra phòng private có password không
        if (room.isPrivate) {
            const passwordMatch = await roomRepository.checkRoomPassword(roomId, password || '');
            if (!passwordMatch) {
                return res.status(STATUS_UNAUTHORIZED_401).json({
                    success: false,
                    error: "Incorrect room password"
                });
            }
        }

        // Kiểm tra player đã trong phòng khác chưa
        const isPlayerInRoom = await roomRepository.isUserInRoom(playerId);
        if (isPlayerInRoom) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Player is already in another room"
            });
        }

        // Thêm player vào phòng
        const updatedRoom = await roomRepository.addPlayerToRoom(roomId, playerId);

        if (!updatedRoom) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to join room"
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: updatedRoom,
            message: 'Player joined room successfully'
        });
    } catch (error: any) {
        console.error('Error joining room:', error);

        if (error.message.includes('Room is full')) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('Room is not active')) {
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

// 10. Xóa player khỏi phòng
roomRouters.post("/room/:roomId/leave", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { playerId } = req.body;

        if (!playerId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "playerId is required"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Kiểm tra player có trong phòng không
        const isPlayerInRoom = await roomRepository.isUserInSpecificRoom(playerId, roomId);
        if (!isPlayerInRoom) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Player is not in this room"
            });
        }

        // Xóa player khỏi phòng
        const updatedRoom = await roomRepository.removePlayerFromRoom(roomId, playerId);

        if (!updatedRoom) {
            // Phòng đã bị xóa vì không còn player
            return res.status(STATUS_OK_200).json({
                success: true,
                data: null,
                message: 'Player left room successfully, room deleted as no players left'
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: updatedRoom,
            message: 'Player left room successfully'
        });
    } catch (error: any) {
        console.error('Error leaving room:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 11. Cập nhật thông tin phòng (chỉ host mới có quyền)
roomRouters.put("/room/:roomId", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const updates = req.body;
        const { userId } = req.body; // Người gửi request

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "userId is required for authorization"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Kiểm tra quyền (chỉ host mới được update)
        if (room.hostId !== userId) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: "Only room host can update room information"
            });
        }

        // Nếu thay đổi roomId, kiểm tra roomId mới không trùng
        if (updates.roomId && updates.roomId !== roomId) {
            const existingRoom = await roomRepository.findRoomByRoomId(updates.roomId);
            if (existingRoom) {
                return res.status(STATUS_BAD_REQUEST_400).json({
                    success: false,
                    error: "New roomId already exists"
                });
            }
        }

        // Validation cho updates
        const validation = validateRoomData(updates);
        if (!validation.isValid) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                errors: validation.errors
            });
        }

        // Cập nhật phòng
        const updatedRoom = await roomRepository.updateRoomByRoomId(roomId, validation.roomData);

        if (!updatedRoom) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to update room"
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: updatedRoom,
            message: 'Room updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating room:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 12. Cập nhật trạng thái phòng (active/inactive)
roomRouters.patch("/room/:roomId/status", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { isUsing, userId } = req.body;

        if (typeof isUsing !== 'boolean') {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "isUsing must be a boolean"
            });
        }

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "userId is required for authorization"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Kiểm tra quyền (chỉ host mới được thay đổi trạng thái)
        if (room.hostId !== userId) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: "Only room host can change room status"
            });
        }

        // Cập nhật trạng thái
        const updatedRoom = await roomRepository.updateRoomStatus(roomId, isUsing);

        if (!updatedRoom) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to update room status"
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: updatedRoom,
            message: `Room ${isUsing ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error: any) {
        console.error('Error updating room status:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 13. Xóa phòng theo roomId (chỉ host mới có quyền)
roomRouters.delete("/room/:roomId", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "userId is required for authorization"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Kiểm tra quyền (chỉ host mới được xóa)
        if (room.hostId !== userId) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: "Only room host can delete the room"
            });
        }

        // Xóa phòng
        const isDeleted = await roomRepository.deleteRoomByRoomId(roomId);

        if (!isDeleted) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to delete room"
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: { roomId },
            message: 'Room deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting room:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 14. Xóa phòng theo ID hệ thống (admin only)
roomRouters.delete("/room/id/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, isAdmin = false } = req.body;

        const idNum = parseInt(id, 10);

        if (isNaN(idNum)) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Invalid room ID'
            });
        }

        if (!isAdmin) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: "Admin privileges required"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomById(idNum);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Xóa phòng
        const isDeleted = await roomRepository.deleteRoomById(idNum);

        if (!isDeleted) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to delete room"
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: { id: idNum, roomId: room.roomId },
            message: 'Room deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting room by ID:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 15. Lấy số lượng player trong phòng
roomRouters.get("/room/:roomId/player-count", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        const playerCount = await roomRepository.countPlayersInRoom(roomId);

        res.status(STATUS_OK_200).json({
            success: true,
            data: {
                roomId,
                playerCount,
                maxCapacity: room.maxPlayers,
                currentPlayers: room.currentPlayers
            },
            message: 'Player count retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting player count:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 16. Chuyển host cho player khác
roomRouters.post("/room/:roomId/transfer-host", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { currentHostId, newHostId } = req.body;

        if (!currentHostId || !newHostId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Both currentHostId and newHostId are required"
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        // Kiểm tra currentHostId có phải là host hiện tại không
        if (room.hostId !== currentHostId) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Current user is not the host"
            });
        }

        // Kiểm tra newHostId có trong phòng không
        if (!room.playerIds.includes(newHostId)) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "New host is not in the room"
            });
        }

        // Chuyển host
        const updatedRoom = await roomRepository.updateRoomByRoomId(roomId, {
            hostId: newHostId
        });

        if (!updatedRoom) {
            return res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
                success: false,
                error: "Failed to transfer host"
            });
        }

        res.status(STATUS_OK_200).json({
            success: true,
            data: updatedRoom,
            message: 'Host transferred successfully'
        });
    } catch (error: any) {
        console.error('Error transferring host:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 17. Kiểm tra mật khẩu phòng
roomRouters.post("/room/:roomId/check-password", async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "password is required"
            });
        }

        const room = await roomRepository.findRoomByRoomId(roomId);
        if (!room) {
            return res.status(STATUS_NOT_FOUND_404).json({
                success: false,
                error: "Room not found"
            });
        }

        const isValid = await roomRepository.checkRoomPassword(roomId, password);

        res.status(STATUS_OK_200).json({
            success: true,
            data: { isValid, isPrivate: room.isPrivate },
            message: isValid ? 'Password is correct' : 'Password is incorrect'
        });
    } catch (error: any) {
        console.error('Error checking room password:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 18. Tìm kiếm phòng
roomRouters.get("/rooms/search", async (req: Request, res: Response) => {
    try {
        const { q, limit = '20' } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: "Search query is required"
            });
        }

        const limitNum = parseInt(limit as string, 10);
        const rooms = await roomRepository.searchRooms(q, limitNum);

        res.status(STATUS_OK_200).json({
            success: true,
            data: rooms,
            message: 'Search results retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error searching rooms:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 19. Lấy thống kê phòng
roomRouters.get("/stats", async (req: Request, res: Response) => {
    try {
        const stats = await roomRepository.getRoomStats();

        res.status(STATUS_OK_200).json({
            success: true,
            data: stats,
            message: 'Room statistics retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting room stats:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 20. Dọn dẹp phòng hết hạn (admin only)
roomRouters.post("/cleanup-expired", async (req: Request, res: Response) => {
    try {
        const { isAdmin = false } = req.body;

        if (!isAdmin) {
            return res.status(STATUS_FORBIDDEN_403).json({
                success: false,
                error: "Admin privileges required"
            });
        }

        const deletedCount = await roomRepository.cleanupExpiredRooms();

        res.status(STATUS_OK_200).json({
            success: true,
            data: { deletedCount },
            message: `Cleaned up ${deletedCount} expired rooms`
        });
    } catch (error: any) {
        console.error('Error cleaning up expired rooms:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// 21. Health check endpoint
roomRouters.get("/health", async (req: Request, res: Response) => {
    try {
        // Kiểm tra kết nối database
        const stats = await roomRepository.getRoomStats();

        res.status(STATUS_OK_200).json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                roomCount: stats.total
            },
            message: 'Room service is healthy'
        });
    } catch (error: any) {
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

export default roomRouters;