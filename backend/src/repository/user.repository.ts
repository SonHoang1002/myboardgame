
import bcrypt from 'bcrypt';
import { mysqlPool } from '../config/Database';
import { User } from '../model/User';
import { UserEntity } from '../model/UserEntity';


export class UserRepository {

  private readonly TABLE_NAME = 'users';

  /**
   * Tạo user mới
   */
  async createUser(user: User): Promise<UserEntity> {
    try {
      // Generate UID nếu không có
      const uid = user.uid || this.generateUID();

      const [result] = await mysqlPool.execute(
        `INSERT INTO ${this.TABLE_NAME} 
                (name_in_game, uid, status, location, avatar_url, phone, 
                 bio, total_games_played, total_games_won, experience_points, 
                 level, last_seen_at, login_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.nameInGame,
          uid,
          user.status || 0,
          user.location || null,
          user.avatarUrl || null,
          user.phone || null,
          user.bio || null,
          user.totalGamesPlayed || 0,
          user.totalGamesWon || 0,
          user.experiencePoints || 0,
          user.level || 1,
          user.lastSeenAt || null,
          user.loginId
        ]
      );

      const insertResult = result as any;
      return await this.findById(insertResult.insertId) as UserEntity;
    } catch (error: any) {
      console.error("Error creating user:", error);

      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User UID already exists');
      }

      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Tìm user theo ID
   */
  async findById(id: number): Promise<UserEntity | null> {
    try {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      const users = rows as any[];
      if (users.length === 0) {
        return null;
      }

      return this.mapToUserEntity(users[0]);
    } catch (error: any) {
      console.error("Error finding user by id:", error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }
  async getUserByNameInGame(nameInGame: string): Promise<UserEntity | null> {
    try {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} WHERE name_in_game = ?`,
        [nameInGame]
      );
      const data = rows as any[];
      return this.mapToUserEntity(data[0]);
    } catch (error: any) {
      console.error("Error finding user by id:", error);
      throw new Error(`Failed to find user: ${error.message}`);
    }

  }
  /**
   * Tìm user theo UID
   */
  async findByUid(uid: string): Promise<UserEntity | null> {
    try {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} WHERE uid = ?`,
        [uid]
      );

      const users = rows as any[];
      if (users.length === 0) {
        return null;
      }

      return this.mapToUserEntity(users[0]);
    } catch (error: any) {
      console.error("Error finding user by uid:", error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Tìm user theo login_id
   */
  async findByLoginId(loginId: number): Promise<UserEntity | null> {
    try {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} WHERE login_id = ?`,
        [loginId]
      );

      const users = rows as any[];
      if (users.length === 0) {
        return null;
      }

      return this.mapToUserEntity(users[0]);
    } catch (error: any) {
      console.error("Error finding user by login_id:", error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Cập nhật user
   */
  async updateUser(id: number, updates: Partial<User>): Promise<UserEntity | null> {
    try {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        return null;
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.nameInGame !== undefined) {
        updateFields.push('name_in_game = ?');
        updateValues.push(updates.nameInGame);
      }

      if (updates.uid !== undefined && updates.uid !== existingUser.uid) {
        // Kiểm tra UID mới có trùng không
        const existingUid = await this.findByUid(updates.uid);
        if (existingUid && existingUid.id !== id) {
          throw new Error('UID already exists');
        }
        updateFields.push('uid = ?');
        updateValues.push(updates.uid);
      }

      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }

      if (updates.location !== undefined) {
        updateFields.push('location = ?');
        updateValues.push(updates.location);
      }

      if (updates.avatarUrl !== undefined) {
        updateFields.push('avatar_url = ?');
        updateValues.push(updates.avatarUrl);
      }

      if (updates.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(updates.phone);
      }

      if (updates.bio !== undefined) {
        updateFields.push('bio = ?');
        updateValues.push(updates.bio);
      }

      if (updates.totalGamesPlayed !== undefined) {
        updateFields.push('total_games_played = ?');
        updateValues.push(updates.totalGamesPlayed);
      }

      if (updates.totalGamesWon !== undefined) {
        updateFields.push('total_games_won = ?');
        updateValues.push(updates.totalGamesWon);
      }

      if (updates.experiencePoints !== undefined) {
        updateFields.push('experience_points = ?');
        updateValues.push(updates.experiencePoints);
      }

      if (updates.level !== undefined) {
        updateFields.push('level = ?');
        updateValues.push(updates.level);
      }

      if (updates.lastSeenAt !== undefined) {
        updateFields.push('last_seen_at = ?');
        updateValues.push(updates.lastSeenAt);
      }

      if (updates.loginId !== undefined) {
        updateFields.push('login_id = ?');
        updateValues.push(updates.loginId);
      }

      if (updateFields.length === 0) {
        return existingUser;
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());
      updateValues.push(id);

      const query = `
                UPDATE ${this.TABLE_NAME} 
                SET ${updateFields.join(', ')} 
                WHERE id = ?
            `;

      await mysqlPool.execute(query, updateValues);
      return await this.findById(id);
    } catch (error: any) {
      console.error("Error updating user:", error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Cập nhật trạng thái user
   */
  async updateUserStatus(id: number, status: number): Promise<boolean> {
    try {
      const [result] = await mysqlPool.execute(
        `UPDATE ${this.TABLE_NAME} 
                 SET status = ?, last_seen_at = ?, updated_at = ? 
                 WHERE id = ?`,
        [status, new Date(), new Date(), id]
      );

      const updateResult = result as any;
      return updateResult.affectedRows > 0;
    } catch (error: any) {
      console.error("Error updating user status:", error);
      throw new Error(`Failed to update user status: ${error.message}`);
    }
  }

  /**
   * Cập nhật last_seen_at
   */
  async updateLastSeen(id: number): Promise<boolean> {
    try {
      const [result] = await mysqlPool.execute(
        `UPDATE ${this.TABLE_NAME} 
                 SET last_seen_at = ?, updated_at = ? 
                 WHERE id = ?`,
        [new Date(), new Date(), id]
      );

      const updateResult = result as any;
      return updateResult.affectedRows > 0;
    } catch (error: any) {
      console.error("Error updating last seen:", error);
      return false;
    }
  }

  /**
   * Thêm kinh nghiệm và tính level
   */
  async addExperience(id: number, exp: number): Promise<{ newExp: number; newLevel: number }> {
    try {
      const userEntity = await this.findById(id);
      if (!userEntity) {
        throw new Error('User not found');
      }

      const newExp = (userEntity.experiencePoints ?? 0) + exp;
      const newLevel = this.calculateLevel(newExp);

      await mysqlPool.execute(
        `UPDATE ${this.TABLE_NAME} 
                 SET experience_points = ?, level = ?, updated_at = ? 
                 WHERE id = ?`,
        [newExp, newLevel, new Date(), id]
      );

      return { newExp, newLevel };
    } catch (error: any) {
      console.error("Error adding experience:", error);
      throw new Error(`Failed to add experience: ${error.message}`);
    }
  }

  /**
   * Tăng số game đã chơi
   */
  async incrementGamesPlayed(id: number, won: boolean = false): Promise<void> {
    try {
      let query = `UPDATE ${this.TABLE_NAME} SET total_games_played = total_games_played + 1`;
      const params: any[] = [];

      if (won) {
        query += ', total_games_won = total_games_won + 1';
      }

      query += ', updated_at = ? WHERE id = ?';
      params.push(new Date(), id);

      await mysqlPool.execute(query, params);
    } catch (error: any) {
      console.error("Error incrementing games played:", error);
      throw new Error(`Failed to increment games: ${error.message}`);
    }
  }

  /**
   * Xóa user
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      const [result] = await mysqlPool.execute(
        `DELETE FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      const deleteResult = result as any;
      return deleteResult.affectedRows > 0;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả users với filter
   */
  async getAllUsers(filters?: {
    status?: number;
    minLevel?: number;
    maxLevel?: number;
    searchTerm?: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ users: UserEntity[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      let query = `SELECT * FROM ${this.TABLE_NAME}`;
      let countQuery = `SELECT COUNT(*) as total FROM ${this.TABLE_NAME}`;
      const conditions: string[] = [];
      const params: any[] = [];
      const countParams: any[] = [];

      // Áp dụng filters
      if (filters?.status !== undefined) {
        conditions.push('status = ?');
        params.push(filters.status);
        countParams.push(filters.status);
      }

      if (filters?.minLevel !== undefined) {
        conditions.push('level >= ?');
        params.push(filters.minLevel);
        countParams.push(filters.minLevel);
      }

      if (filters?.maxLevel !== undefined) {
        conditions.push('level <= ?');
        params.push(filters.maxLevel);
        countParams.push(filters.maxLevel);
      }

      if (filters?.searchTerm) {
        conditions.push('MATCH(name_in_game, bio) AGAINST(? IN BOOLEAN MODE)');
        params.push(`*${filters.searchTerm}*`);
        countParams.push(`*${filters.searchTerm}*`);
      }

      if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
      }

      // Sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'DESC';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Pagination
      const limit = filters?.limit || 50;
      const page = filters?.page || 1;
      const offset = (page - 1) * limit;

      if (limit) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
      }

      const [rows] = await mysqlPool.execute(query, params);
      const [countResult] = await mysqlPool.execute(countQuery, countParams);

      const users = rows as any[];
      const total = (countResult as any[])[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map(user => this.mapToUserEntity(user)),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error: any) {
      console.error("Error getting all users:", error);
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Tìm kiếm users
   */
  async searchUsers(searchTerm: string, limit: number = 20): Promise<UserEntity[]> {
    try {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE MATCH(name_in_game, bio) AGAINST(? IN BOOLEAN MODE)
                 OR name_in_game LIKE ? 
                 OR uid LIKE ?
                 ORDER BY level DESC, total_games_won DESC
                 LIMIT ?`,
        [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`, limit]
      );

      const users = rows as any[];
      return users.map(user => this.mapToUserEntity(user));
    } catch (error: any) {
      console.error("Error searching users:", error);
      return [];
    }
  }

  /**
   * Lấy users online
   */
  async getOnlineUsers(): Promise<UserEntity[]> {
    try {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} 
                 WHERE status IN (1, 2) 
                 ORDER BY last_seen_at DESC`,
        []
      );

      const users = rows as any[];
      return users.map(user => this.mapToUserEntity(user));
    } catch (error: any) {
      console.error("Error getting online users:", error);
      return [];
    }
  }

  /**
   * Lấy top players
   */
  async getTopPlayers(limit: number = 10, by: 'level' | 'wins' | 'exp' = 'level'): Promise<UserEntity[]> {
    try {
      let orderBy = '';
      switch (by) {
        case 'wins':
          orderBy = 'total_games_won DESC, level DESC';
          break;
        case 'exp':
          orderBy = 'experience_points DESC, level DESC';
          break;
        default:
          orderBy = 'level DESC, experience_points DESC';
      }

      const [rows] = await mysqlPool.execute(
        `SELECT * FROM ${this.TABLE_NAME} 
                 ORDER BY ${orderBy} 
                 LIMIT ?`,
        [limit]
      );

      const users = rows as any[];
      return users.map(user => this.mapToUserEntity(user));
    } catch (error: any) {
      console.error("Error getting top players:", error);
      return [];
    }
  }

  /**
   * Lấy user statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    online: number;
    inGame: number;
    offline: number;
    averageLevel: number;
    totalGamesPlayed: number;
    totalGamesWon: number;
    winRate: number;
  }> {
    try {
      // Tổng số users
      const [totalResult] = await mysqlPool.execute(
        `SELECT COUNT(*) as total FROM ${this.TABLE_NAME}`
      );

      // Users online
      const [onlineResult] = await mysqlPool.execute(
        `SELECT COUNT(*) as online FROM ${this.TABLE_NAME} WHERE status = 1`
      );

      // Users in-game
      const [inGameResult] = await mysqlPool.execute(
        `SELECT COUNT(*) as inGame FROM ${this.TABLE_NAME} WHERE status = 2`
      );

      // Users offline
      const [offlineResult] = await mysqlPool.execute(
        `SELECT COUNT(*) as offline FROM ${this.TABLE_NAME} WHERE status = 0`
      );

      // Average level
      const [avgLevelResult] = await mysqlPool.execute(
        `SELECT AVG(level) as avgLevel FROM ${this.TABLE_NAME}`
      );

      // Total games played
      const [totalGamesResult] = await mysqlPool.execute(
        `SELECT SUM(total_games_played) as totalGames FROM ${this.TABLE_NAME}`
      );

      // Total games won
      const [totalWinsResult] = await mysqlPool.execute(
        `SELECT SUM(total_games_won) as totalWins FROM ${this.TABLE_NAME}`
      );

      const total = (totalResult as any[])[0]?.total || 0;
      const online = (onlineResult as any[])[0]?.online || 0;
      const inGame = (inGameResult as any[])[0]?.inGame || 0;
      const offline = (offlineResult as any[])[0]?.offline || 0;
      const averageLevel = parseFloat((avgLevelResult as any[])[0]?.avgLevel || 0).toFixed(2);
      const totalGamesPlayed = (totalGamesResult as any[])[0]?.totalGames || 0;
      const totalGamesWon = (totalWinsResult as any[])[0]?.totalWins || 0;
      const winRate = totalGamesPlayed > 0
        ? parseFloat(((totalGamesWon / totalGamesPlayed) * 100).toFixed(2))
        : 0;

      return {
        total,
        online,
        inGame,
        offline,
        averageLevel: parseFloat(averageLevel),
        totalGamesPlayed,
        totalGamesWon,
        winRate
      };
    } catch (error: any) {
      console.error("Error getting user statistics:", error);
      return {
        total: 0,
        online: 0,
        inGame: 0,
        offline: 0,
        averageLevel: 0,
        totalGamesPlayed: 0,
        totalGamesWon: 0,
        winRate: 0
      };
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<any> {
    try {
      const [result] = await mysqlPool.execute('SELECT 1 as test');
      return result;
    } catch (error: any) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */
  private generateUID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'USER-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private calculateLevel(exp: number): number {
    // Công thức tính level: level = floor(sqrt(exp / 100))
    return Math.max(1, Math.floor(Math.sqrt(exp / 100)));
  }

  private mapToUserEntity(row: any): UserEntity {
    return {
      id: row.id,
      nameInGame: row.name_in_game,
      uid: row.uid,
      status: row.status,
      location: row.location,
      avatarUrl: row.avatar_url,
      phone: row.phone,
      bio: row.bio,
      totalGamesPlayed: row.total_games_played || 0,
      totalGamesWon: row.total_games_won || 0,
      experiencePoints: row.experience_points || 0,
      level: row.level || 1,
      gold: row.gold || 0,
      lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : undefined,
      loginId: row.login_id,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
    };
  }
}