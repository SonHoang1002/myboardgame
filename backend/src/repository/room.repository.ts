
import { RoomEntity } from "../model/RoomEntity";
import { Room } from "../model/Room";
import { mysqlPool } from "../config/Database";


export class RoomRepository {
    private readonly TABLE_NAME = 'rooms'; // Cập nhật tên bảng

    /**
     * Tạo phòng mới
     */
    async createRoom(room: Room): Promise<RoomEntity> {
        try {
            // Chuẩn bị dữ liệu
            const playerIdsJson = JSON.stringify(room.playerIds || []);
            const gameSettingsJson = JSON.stringify(room.gameSettings || {});

            const [result] = await mysqlPool.execute(
                `INSERT INTO ${this.TABLE_NAME} 
                (room_id, room_name, description, player_ids, host_id, 
                 max_players, is_using, is_private, password, game_mode, 
                 game_settings, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    room.roomId,
                    room.roomName || null,
                    room.description || null,
                    playerIdsJson,
                    room.hostId,
                    room.maxPlayers || 4,
                    room.isUsing ?? true,
                    room.isPrivate ?? false,
                    room.password || null,
                    room.gameMode || 'default',
                    gameSettingsJson,
                    room.expiresAt || null
                ]
            );

            const insertResult = result as any;

            // Lấy room vừa tạo để có đầy đủ thông tin
            return await this.findRoomByRoomId(room.roomId) as RoomEntity;

        } catch (error: any) {
            console.error("Error in create room:", error);

            // Xử lý lỗi duplicate key
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error(`Room ID '${room.roomId}' already exists`);
            }

            throw new Error(`Failed to create room: ${error.message}`);
        }
    }

    /**
     * Kiểm tra xem user có trong phòng hay không
     */
    async isUserInRoom(userId: string): Promise<boolean> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT COUNT(*) as count FROM ${this.TABLE_NAME} 
                 WHERE JSON_CONTAINS(player_ids, ?) = 1 
                 AND is_using = TRUE`,
                [`"${userId}"`]
            );

            const result = rows as any[];
            return result[0]?.count > 0;
        } catch (error: any) {
            console.error("Error checking if user is in room:", error);
            throw new Error(`Failed to check user in room: ${error.message}`);
        }
    }

    /**
     * Kiểm tra user có trong phòng cụ thể không
     */
    async isUserInSpecificRoom(userId: string, roomId: string): Promise<boolean> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT COUNT(*) as count FROM ${this.TABLE_NAME} 
                 WHERE room_id = ? AND JSON_CONTAINS(player_ids, ?) = 1`,
                [roomId, `"${userId}"`]
            );

            const result = rows as any[];
            return result[0]?.count > 0;
        } catch (error: any) {
            console.error("Error checking user in specific room:", error);
            throw new Error(`Failed to check user in specific room: ${error.message}`);
        }
    }

    /**
     * Trả ra tất cả các room
     */
    async getAllRooms(filters?: {
        includeInactive?: boolean;
        gameMode?: string;
        isPrivate?: boolean;
        minPlayers?: number;
        maxPlayers?: number;
        searchTerm?: string;
        limit?: number;
        page?: number;
    }): Promise<{ rooms: RoomEntity[]; total: number; page: number; limit: number; totalPages: number }> {
        try {
            let query = `SELECT * FROM ${this.TABLE_NAME}`;
            let countQuery = `SELECT COUNT(*) as total FROM ${this.TABLE_NAME}`;
            const conditions: string[] = [];
            const params: any[] = [];
            const countParams: any[] = [];

            // Áp dụng filters
            if (filters?.includeInactive !== true) {
                conditions.push('is_using = TRUE');
            }

            if (filters?.gameMode) {
                conditions.push('game_mode = ?');
                params.push(filters.gameMode);
                countParams.push(filters.gameMode);
            }

            if (filters?.isPrivate !== undefined) {
                conditions.push('is_private = ?');
                params.push(filters.isPrivate);
                countParams.push(filters.isPrivate);
            }

            if (filters?.minPlayers !== undefined) {
                conditions.push('max_players >= ?');
                params.push(filters.minPlayers);
                countParams.push(filters.minPlayers);
            }

            if (filters?.maxPlayers !== undefined) {
                conditions.push('max_players <= ?');
                params.push(filters.maxPlayers);
                countParams.push(filters.maxPlayers);
            }

            if (filters?.searchTerm) {
                conditions.push('(room_name LIKE ? OR description LIKE ?)');
                const searchTerm = `%${filters.searchTerm}%`;
                params.push(searchTerm, searchTerm);
                countParams.push(searchTerm, searchTerm);
            }

            if (conditions.length > 0) {
                const whereClause = ` WHERE ${conditions.join(' AND ')}`;
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY last_activity_at DESC, created_at DESC';

            // Pagination
            const limit = filters?.limit || 50;
            const page = filters?.page || 1;
            const offset = (page - 1) * limit;

            if (limit) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(limit, offset);
            }

            // Thực thi query
            const [rows] = await mysqlPool.execute(query, params);
            const [countResult] = await mysqlPool.execute(countQuery, countParams);

            const rooms = rows as any[];
            const total = (countResult as any[])[0]?.total || 0;
            const totalPages = Math.ceil(total / limit);

            return {
                rooms: rooms.map(room => this.mapToRoomEntity(room)),
                total,
                page,
                limit,
                totalPages
            };
        } catch (error: any) {
            console.error("Error getting all rooms:", error);
            throw new Error(`Failed to get all rooms: ${error.message}`);
        }
    }

    /**
     * Trả ra tất cả các room đang hoạt động
     */
    async getActiveRooms(): Promise<RoomEntity[]> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE is_using = TRUE 
                 ORDER BY last_activity_at DESC`,
                []
            );

            const rooms = rows as any[];
            return rooms.map(room => this.mapToRoomEntity(room));
        } catch (error: any) {
            console.error("Error getting active rooms:", error);
            throw new Error(`Failed to get active rooms: ${error.message}`);
        }
    }

    /**
     * Tìm phòng theo roomId
     */
    async findRoomByRoomId(roomId: string): Promise<RoomEntity | null> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} WHERE room_id = ?`,
                [roomId]
            );

            const rooms = rows as any[];
            if (rooms.length === 0) {
                return null;
            }

            return this.mapToRoomEntity(rooms[0]);
        } catch (error: any) {
            console.error("Error finding room by roomId:", error);
            throw new Error(`Failed to find room by roomId: ${error.message}`);
        }
    }

    /**
     * Tìm phòng theo id tạo bởi hệ thống
     */
    async findRoomById(id: number): Promise<RoomEntity | null> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`,
                [id]
            );

            const rooms = rows as any[];
            if (rooms.length === 0) {
                return null;
            }

            return this.mapToRoomEntity(rooms[0]);
        } catch (error: any) {
            console.error("Error finding room by id:", error);
            throw new Error(`Failed to find room by id: ${error.message}`);
        }
    }

    /**
     * Thay đổi room theo roomId
     */
    async updateRoomByRoomId(roomId: string, updates: Partial<Room>): Promise<RoomEntity | null> {
        try {
            // Lấy thông tin room hiện tại
            const existingRoom = await this.findRoomByRoomId(roomId);
            if (!existingRoom) {
                return null;
            }

            // Chuẩn bị dữ liệu cập nhật
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (updates.roomName !== undefined) {
                updateFields.push('room_name = ?');
                updateValues.push(updates.roomName);
            }

            if (updates.description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(updates.description);
            }

            if (updates.playerIds !== undefined) {
                updateFields.push('player_ids = ?');
                updateValues.push(JSON.stringify(updates.playerIds));
            }

            if (updates.hostId !== undefined) {
                updateFields.push('host_id = ?');
                updateValues.push(updates.hostId);
            }

            if (updates.maxPlayers !== undefined) {
                updateFields.push('max_players = ?');
                updateValues.push(updates.maxPlayers);
            }

            if (updates.isUsing !== undefined) {
                updateFields.push('is_using = ?');
                updateValues.push(updates.isUsing);
            }

            if (updates.isPrivate !== undefined) {
                updateFields.push('is_private = ?');
                updateValues.push(updates.isPrivate);
            }

            if (updates.password !== undefined) {
                updateFields.push('password = ?');
                updateValues.push(updates.password);
            }

            if (updates.gameMode !== undefined) {
                updateFields.push('game_mode = ?');
                updateValues.push(updates.gameMode);
            }

            if (updates.gameSettings !== undefined) {
                updateFields.push('game_settings = ?');
                updateValues.push(JSON.stringify(updates.gameSettings || {}));
            }

            if (updates.expiresAt !== undefined) {
                updateFields.push('expires_at = ?');
                updateValues.push(updates.expiresAt);
            }

            // Cập nhật thời gian hoạt động và cập nhật
            updateFields.push('last_activity_at = ?');
            updateValues.push(new Date());
            updateFields.push('updated_at = ?');
            updateValues.push(new Date());

            if (updateFields.length === 0) {
                return existingRoom;
            }

            // Thêm roomId vào cuối cho WHERE clause
            updateValues.push(roomId);

            const query = `
                UPDATE ${this.TABLE_NAME} 
                SET ${updateFields.join(', ')} 
                WHERE room_id = ?
            `;

            await mysqlPool.execute(query, updateValues);

            // Lấy thông tin mới nhất
            return await this.findRoomByRoomId(updates.roomId || roomId);
        } catch (error: any) {
            console.error("Error updating room:", error);
            throw new Error(`Failed to update room: ${error.message}`);
        }
    }

    /**
     * Thêm player vào room
     */
    async addPlayerToRoom(roomId: string, playerId: string): Promise<RoomEntity | null> {
        try {
            const room = await this.findRoomByRoomId(roomId);
            if (!room) {
                return null;
            }

            // Kiểm tra room có đang hoạt động không
            if (!room.isUsing) {
                throw new Error("Room is not active");
            }

            // Kiểm tra phòng đã đầy chưa
            if (room.currentPlayers && room.maxPlayers && room.currentPlayers >= room.maxPlayers) {
                throw new Error(`Room is full (max ${room.maxPlayers} players)`);
            }

            // Kiểm tra player đã có trong room chưa
            if (room.playerIds.includes(playerId)) {
                return room;
            }

            // Thêm player mới
            const updatedPlayerIds = [...room.playerIds, playerId];

            return await this.updateRoomByRoomId(roomId, {
                playerIds: updatedPlayerIds
            });
        } catch (error: any) {
            console.error("Error adding player to room:", error);
            throw new Error(`Failed to add player to room: ${error.message}`);
        }
    }

    /**
     * Xóa player khỏi room
     */
    async removePlayerFromRoom(roomId: string, playerId: string): Promise<RoomEntity | null> {
        try {
            const room = await this.findRoomByRoomId(roomId);
            if (!room) {
                return null;
            }

            // Xóa player khỏi danh sách
            const updatedPlayerIds = room.playerIds.filter(id => id !== playerId);

            const updatedRoom = await this.updateRoomByRoomId(roomId, {
                playerIds: updatedPlayerIds
            });

            // Nếu host rời phòng, chuyển host cho người khác
            if (room.hostId === playerId && updatedRoom && updatedRoom.playerIds.length > 0) {
                const newHostId = updatedRoom.playerIds[0];
                await this.updateRoomByRoomId(roomId, { hostId: newHostId });
            }

            // Nếu không còn player nào, xóa phòng
            if (updatedRoom && updatedRoom.playerIds.length === 0) {
                await this.deleteRoomByRoomId(roomId);
                return null;
            }

            return updatedRoom;
        } catch (error: any) {
            console.error("Error removing player from room:", error);
            throw new Error(`Failed to remove player from room: ${error.message}`);
        }
    }

    /**
     * Xóa room theo roomId
     */
    async deleteRoomByRoomId(roomId: string): Promise<boolean> {
        try {
            const [result] = await mysqlPool.execute(
                `DELETE FROM ${this.TABLE_NAME} WHERE room_id = ?`,
                [roomId]
            );

            const deleteResult = result as any;
            return deleteResult.affectedRows > 0;
        } catch (error: any) {
            console.error("Error deleting room:", error);
            throw new Error(`Failed to delete room: ${error.message}`);
        }
    }

    /**
     * Xóa room theo id hệ thống
     */
    async deleteRoomById(id: number): Promise<boolean> {
        try {
            const [result] = await mysqlPool.execute(
                `DELETE FROM ${this.TABLE_NAME} WHERE id = ?`,
                [id]
            );

            const deleteResult = result as any;
            return deleteResult.affectedRows > 0;
        } catch (error: any) {
            console.error("Error deleting room by id:", error);
            throw new Error(`Failed to delete room by id: ${error.message}`);
        }
    }

    /**
     * Tìm phòng theo hostId
     */
    async findRoomsByHostId(hostId: string): Promise<RoomEntity[]> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE host_id = ? 
                 ORDER BY last_activity_at DESC`,
                [hostId]
            );

            const rooms = rows as any[];
            return rooms.map(room => this.mapToRoomEntity(room));
        } catch (error: any) {
            console.error("Error finding rooms by hostId:", error);
            throw new Error(`Failed to find rooms by hostId: ${error.message}`);
        }
    }

    /**
     * Tìm phòng mà user tham gia
     */
    async findRoomsByPlayerId(playerId: string): Promise<RoomEntity[]> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE JSON_CONTAINS(player_ids, ?) = 1 
                 ORDER BY last_activity_at DESC`,
                [`"${playerId}"`]
            );

            const rooms = rows as any[];
            return rooms.map(room => this.mapToRoomEntity(room));
        } catch (error: any) {
            console.error("Error finding rooms by playerId:", error);
            throw new Error(`Failed to find rooms by playerId: ${error.message}`);
        }
    }

    /**
     * Đếm số lượng player trong room
     */
    async countPlayersInRoom(roomId: string): Promise<number> {
        try {
            const room = await this.findRoomByRoomId(roomId);
            if (!room) {
                return 0;
            }
            return room.playerIds.length;
        } catch (error: any) {
            console.error("Error counting players in room:", error);
            throw new Error(`Failed to count players in room: ${error.message}`);
        }
    }

    /**
     * Cập nhật trạng thái isUsing của room
     */
    async updateRoomStatus(roomId: string, isUsing: boolean): Promise<RoomEntity | null> {
        try {
            return await this.updateRoomByRoomId(roomId, { isUsing });
        } catch (error: any) {
            console.error("Error updating room status:", error);
            throw new Error(`Failed to update room status: ${error.message}`);
        }
    }

    /**
     * Tìm phòng có slot trống (chưa đầy player)
     */
    async findAvailableRooms(maxPlayers?: number): Promise<RoomEntity[]> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE is_using = TRUE 
                 AND JSON_LENGTH(player_ids) < (CASE WHEN ? IS NOT NULL THEN ? ELSE max_players END)
                 ORDER BY last_activity_at DESC`,
                [maxPlayers, maxPlayers]
            );

            const rooms = rows as any[];
            return rooms.map(room => this.mapToRoomEntity(room));
        } catch (error: any) {
            console.error("Error finding available rooms:", error);
            throw new Error(`Failed to find available rooms: ${error.message}`);
        }
    }

    /**
     * Kiểm tra mật khẩu phòng
     */
    async checkRoomPassword(roomId: string, password: string): Promise<boolean> {
        try {
            const room = await this.findRoomByRoomId(roomId);
            if (!room || !room.isPrivate) {
                return true; // Phòng không có password hoặc không phải private
            }

            return room.password === password;
        } catch (error: any) {
            console.error("Error checking room password:", error);
            return false;
        }
    }

    /**
     * Xóa phòng hết hạn
     */
    async cleanupExpiredRooms(): Promise<number> {
        try {
            const [result] = await mysqlPool.execute(
                `DELETE FROM ${this.TABLE_NAME} 
                 WHERE expires_at IS NOT NULL 
                 AND expires_at < ?`,
                [new Date()]
            );

            const deleteResult = result as any;
            return deleteResult.affectedRows;
        } catch (error: any) {
            console.error("Error cleaning up expired rooms:", error);
            return 0;
        }
    }

    /**
     * Update last activity time
     */
    async updateLastActivity(roomId: string): Promise<void> {
        try {
            await mysqlPool.execute(
                `UPDATE ${this.TABLE_NAME} 
                 SET last_activity_at = ? 
                 WHERE room_id = ?`,
                [new Date(), roomId]
            );
        } catch (error: any) {
            console.error("Error updating last activity:", error);
        }
    }

    /**
     * Lấy thống kê phòng
     */
    async getRoomStats(): Promise<{
        total: number;
        active: number;
        private: number;
        byGameMode: Record<string, number>;
        averagePlayers: number;
    }> {
        try {
            // Tổng số phòng
            const [totalResult] = await mysqlPool.execute(
                `SELECT COUNT(*) as total FROM ${this.TABLE_NAME}`
            );

            // Số phòng đang hoạt động
            const [activeResult] = await mysqlPool.execute(
                `SELECT COUNT(*) as active FROM ${this.TABLE_NAME} WHERE is_using = TRUE`
            );

            // Số phòng private
            const [privateResult] = await mysqlPool.execute(
                `SELECT COUNT(*) as private FROM ${this.TABLE_NAME} WHERE is_private = TRUE`
            );

            // Số phòng theo game mode
            const [gameModeResult] = await mysqlPool.execute(
                `SELECT game_mode, COUNT(*) as count 
                 FROM ${this.TABLE_NAME} 
                 GROUP BY game_mode`
            );

            // Trung bình số player
            const [avgResult] = await mysqlPool.execute(
                `SELECT AVG(JSON_LENGTH(player_ids)) as avg_players 
                 FROM ${this.TABLE_NAME} 
                 WHERE is_using = TRUE`
            );

            const total = (totalResult as any[])[0]?.total || 0;
            const active = (activeResult as any[])[0]?.active || 0;
            const privateCount = (privateResult as any[])[0]?.private || 0;
            const averagePlayers = parseFloat((avgResult as any[])[0]?.avg_players || 0).toFixed(2);

            const byGameMode: Record<string, number> = {};
            (gameModeResult as any[]).forEach(row => {
                byGameMode[row.game_mode] = row.count;
            });

            return {
                total,
                active,
                private: privateCount,
                byGameMode,
                averagePlayers: parseFloat(averagePlayers)
            };
        } catch (error: any) {
            console.error("Error getting room stats:", error);
            return {
                total: 0,
                active: 0,
                private: 0,
                byGameMode: {},
                averagePlayers: 0
            };
        }
    }

    /**
     * Tìm phòng bằng full-text search
     */
    async searchRooms(searchTerm: string, limit: number = 20): Promise<RoomEntity[]> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE MATCH(room_name, description) AGAINST(? IN BOOLEAN MODE)
                 AND is_using = TRUE
                 ORDER BY last_activity_at DESC
                 LIMIT ?`,
                [searchTerm, limit]
            );

            const rooms = rows as any[];
            return rooms.map(room => this.mapToRoomEntity(room));
        } catch (error: any) {
            console.error("Error searching rooms:", error);
            return [];
        }
    }

    /**
     * Map dữ liệu từ database sang RoomEntity
     */
    private mapToRoomEntity(row: any): RoomEntity {
        try {
            // Parse JSON fields
            const playerIds = row.player_ids ? JSON.parse(row.player_ids) : [];
            const gameSettings = row.game_settings ? JSON.parse(row.game_settings) : {};

            return {
                id: row.id,
                roomId: row.room_id,
                roomName: row.room_name,
                description: row.description,
                playerIds,
                hostId: row.host_id,
                maxPlayers: row.max_players || 4,
                currentPlayers: row.current_players || playerIds.length,
                isUsing: Boolean(row.is_using),
                isPrivate: Boolean(row.is_private),
                password: row.password,
                gameMode: row.game_mode || 'default',
                gameSettings,
                expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
                lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : undefined,
                createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
            };
        } catch (error) {
            console.error("Error mapping room entity:", error);

            // Fallback để không crash
            return {
                id: row.id || 0,
                roomId: row.room_id || '',
                playerIds: [],
                hostId: row.host_id || '',
                isUsing: Boolean(row.is_using),
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
    }
}