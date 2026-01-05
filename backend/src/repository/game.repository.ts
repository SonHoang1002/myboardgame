import { mysqlPool } from "../config/Database";
import { Game, GameStatus } from "../model/Game";
import { GameEntity } from "../model/GameEntity";


export class GameRepository {
    private readonly TABLE_NAME = 'game';

    /**
     * Tạo game mới từ room
     */
    async createGame(game: Game): Promise<GameEntity> {
        try {
            const gameId = this.generateGameId();

            // Xác định currentPlayerId mặc định (player đầu tiên)
            const defaultCurrentPlayerId = game.activePlayerIds.length > 0
                ? game.activePlayerIds[0]
                : '';

            const [result] = await mysqlPool.execute(
                `INSERT INTO ${this.TABLE_NAME} 
                (gameId, roomId, active_deck, inactive_deck, turn_cicle_clock, 
                 current_player_id, active_player_ids, inactive_player_ids, 
                 observer_player_ids, game_mode, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    gameId,
                    game.roomId,
                    JSON.stringify(game.activeDeck || []),
                    JSON.stringify(game.inActiveDeck || []),
                    game.turnCicleClock ?? true,
                    game.currentPlayerId || defaultCurrentPlayerId,
                    JSON.stringify(game.activePlayerIds || []),
                    JSON.stringify(game.inActivePlayerIds || []),
                    JSON.stringify(game.observerPlayerIds || []),
                    game.gameMode,
                    game.status || GameStatus.WAITING
                ]
            );

            const insertResult = result as any;
            const gameEntity: GameEntity = {
                id: insertResult.insertId.toString(),
                gameId,
                roomId: game.roomId,
                activeDeck: game.activeDeck || [],
                inActiveDeck: game.inActiveDeck || [],
                turnCicleClock: game.turnCicleClock ?? true,
                currentPlayerId: game.currentPlayerId || defaultCurrentPlayerId,
                activePlayerIds: game.activePlayerIds || [],
                inActivePlayerIds: game.inActivePlayerIds || [],
                observerPlayerIds: game.observerPlayerIds || [],
                gameMode: game.gameMode,
                status: game.status || GameStatus.WAITING,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            return gameEntity;
        } catch (error: any) {
            console.error("Error in create game:", error);
            throw new Error(`Failed to create game: ${error.message}`);
        }
    }

    /**
     * Lấy game theo gameId
     */
    async findGameByGameId(gameId: string): Promise<GameEntity | null> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} WHERE gameId = ?`,
                [gameId]
            );

            const games = rows as any[];
            if (games.length === 0) {
                return null;
            }

            return this.mapToGameEntity(games[0]);
        } catch (error: any) {
            console.error("Error finding game by gameId:", error);
            throw new Error(`Failed to find game by gameId: ${error.message}`);
        }
    }

    /**
     * Lấy game theo roomId
     */
    async findGameByRoomId(roomId: string): Promise<GameEntity | null> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} WHERE roomId = ? ORDER BY created_at DESC LIMIT 1`,
                [roomId]
            );

            const games = rows as any[];
            if (games.length === 0) {
                return null;
            }

            return this.mapToGameEntity(games[0]);
        } catch (error: any) {
            console.error("Error finding game by roomId:", error);
            throw new Error(`Failed to find game by roomId: ${error.message}`);
        }
    }

    /**
     * Lấy tất cả game với filter
     */
    async getAllGames(filters?: {
        status?: GameStatus;
        gameMode?: string;
        roomId?: string;
        minPlayers?: number;
        limit?: number;
        page?: number;
    }): Promise<{ games: GameEntity[]; total: number }> {
        try {
            let query = `SELECT * FROM ${this.TABLE_NAME}`;
            let countQuery = `SELECT COUNT(*) as total FROM ${this.TABLE_NAME}`;
            const conditions: string[] = [];
            const params: any[] = [];
            const countParams: any[] = [];

            // Áp dụng filters
            if (filters?.status) {
                conditions.push('status = ?');
                params.push(filters.status);
                countParams.push(filters.status);
            }

            if (filters?.gameMode) {
                conditions.push('game_mode = ?');
                params.push(filters.gameMode);
                countParams.push(filters.gameMode);
            }

            if (filters?.roomId) {
                conditions.push('roomId = ?');
                params.push(filters.roomId);
                countParams.push(filters.roomId);
            }

            if (filters?.minPlayers !== undefined) {
                conditions.push('JSON_LENGTH(active_player_ids) >= ?');
                params.push(filters.minPlayers);
                countParams.push(filters.minPlayers);
            }

            if (conditions.length > 0) {
                const whereClause = ` WHERE ${conditions.join(' AND ')}`;
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY created_at DESC';

            // Pagination
            if (filters?.limit) {
                const offset = (filters.page || 0) * filters.limit;
                query += ` LIMIT ? OFFSET ?`;
                params.push(filters.limit, offset);
            }

            const [rows] = await mysqlPool.execute(query, params);
            const [countResult] = await mysqlPool.execute(countQuery, countParams);

            const games = rows as any[];
            const total = (countResult as any[])[0]?.total || 0;

            return {
                games: games.map(game => this.mapToGameEntity(game)),
                total
            };
        } catch (error: any) {
            console.error("Error getting all games:", error);
            throw new Error(`Failed to get all games: ${error.message}`);
        }
    }

    /**
     * Lấy game theo trạng thái
     */
    async getGamesByStatus(status: GameStatus): Promise<GameEntity[]> {
        try {
            const [rows] = await mysqlPool.execute(
                `SELECT * FROM ${this.TABLE_NAME} WHERE status = ? ORDER BY created_at DESC`,
                [status]
            );

            const games = rows as any[];
            return games.map(game => this.mapToGameEntity(game));
        } catch (error: any) {
            console.error("Error getting games by status:", error);
            throw new Error(`Failed to get games by status: ${error.message}`);
        }
    }

    /**
     * Lấy game đang chờ (waiting)
     */
    async getWaitingGames(): Promise<GameEntity[]> {
        return this.getGamesByStatus(GameStatus.WAITING);
    }

    /**
     * Lấy game đang hoạt động (active)
     */
    async getActiveGames(): Promise<GameEntity[]> {
        return this.getGamesByStatus(GameStatus.ACTIVE);
    }

    /**
     * Lấy game đã kết thúc (finished)
     */
    async getFinishedGames(): Promise<GameEntity[]> {
        return this.getGamesByStatus(GameStatus.FINISHED);
    }

    /**
     * Cập nhật game
     */
    async updateGame(gameId: string, updates: Partial<Game>): Promise<GameEntity | null> {
        try {
            const existingGame = await this.findGameByGameId(gameId);
            if (!existingGame) {
                return null;
            }

            const updateFields: string[] = [];
            const updateValues: any[] = [];

            // ... các field khác giữ nguyên

            if (updates.currentPlayerId !== undefined) {
                updateFields.push('current_player_id = ?');
                updateValues.push(updates.currentPlayerId);
            }

            // ... các field khác

            if (updateFields.length === 0) {
                return existingGame;
            }

            updateValues.push(gameId);
            const query = `
                UPDATE ${this.TABLE_NAME} 
                SET ${updateFields.join(', ')} 
                WHERE gameId = ?
            `;

            await mysqlPool.execute(query, updateValues);
            return await this.findGameByGameId(gameId);
        } catch (error: any) {
            console.error("Error updating game:", error);
            throw new Error(`Failed to update game: ${error.message}`);
        }
    }

    /**
     * Cập nhật trạng thái game
     */
    async updateGameStatus(gameId: string, status: GameStatus): Promise<GameEntity | null> {
        try {
            return await this.updateGame(gameId, { status });
        } catch (error: any) {
            console.error("Error updating game status:", error);
            throw new Error(`Failed to update game status: ${error.message}`);
        }
    }

    /**
     * Chuyển lượt cho player tiếp theo
     */
    async moveToNextPlayer(gameId: string): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            // Kiểm tra game status
            if (game.status !== GameStatus.ACTIVE) {
                throw new Error("Cannot move to next player in non-active game");
            }

            // Kiểm tra có active players không
            if (game.activePlayerIds.length === 0) {
                return game;
            }

            // Tìm index của current player
            const currentIndex = game.activePlayerIds.indexOf(game.currentPlayerId);
            let nextPlayerId: string;

            if (currentIndex === -1) {
                // Nếu current player không tồn tại trong active players, chọn player đầu tiên
                nextPlayerId = game.activePlayerIds[0];
            } else {
                // Xác định player tiếp theo dựa trên hướng lượt
                if (game.turnCicleClock) {
                    // Theo chiều kim đồng hồ
                    nextPlayerId = game.activePlayerIds[
                        (currentIndex + 1) % game.activePlayerIds.length
                    ];
                } else {
                    // Ngược chiều kim đồng hồ
                    nextPlayerId = game.activePlayerIds[
                        (currentIndex - 1 + game.activePlayerIds.length) % game.activePlayerIds.length
                    ];
                }
            }

            // Cập nhật current player
            return await this.updateGame(gameId, {
                currentPlayerId: nextPlayerId
            });
        } catch (error: any) {
            console.error("Error moving to next player:", error);
            throw new Error(`Failed to move to next player: ${error.message}`);
        }
    }

    async setCurrentPlayer(gameId: string, playerId: string): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            // Kiểm tra player có trong active players không
            if (!game.activePlayerIds.includes(playerId)) {
                throw new Error("Player is not in active players");
            }

            // Kiểm tra game status
            if (game.status !== GameStatus.ACTIVE) {
                throw new Error("Cannot set current player in non-active game");
            }

            return await this.updateGame(gameId, {
                currentPlayerId: playerId
            });
        } catch (error: any) {
            console.error("Error setting current player:", error);
            throw new Error(`Failed to set current player: ${error.message}`);
        }
    }

    /**
     * Bắt đầu game (chuyển từ waiting sang active)
     */
    async startGame(gameId: string): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            if (game.status !== GameStatus.WAITING) {
                throw new Error(`Cannot start game with status: ${game.status}`);
            }

            // Kiểm tra số lượng player
            if (game.activePlayerIds.length < 2) {
                throw new Error("Need at least 2 players to start the game");
            }

            return await this.updateGameStatus(gameId, GameStatus.ACTIVE);
        } catch (error: any) {
            console.error("Error starting game:", error);
            throw new Error(`Failed to start game: ${error.message}`);
        }
    }

    /**
     * Kết thúc game (chuyển sang finished)
     */
    async finishGame(gameId: string, winnerId?: string): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            // Lưu thông tin winner nếu có
            if (winnerId) {
                // TODO: Có thể lưu vào bảng game_results
                console.log(`Game ${gameId} finished with winner: ${winnerId}`);
            }

            return await this.updateGameStatus(gameId, GameStatus.FINISHED);
        } catch (error: any) {
            console.error("Error finishing game:", error);
            throw new Error(`Failed to finish game: ${error.message}`);
        }
    }

    /**
     * Thêm player vào game
     */
    async addPlayerToGame(gameId: string, playerId: string, role: 'active' | 'observer' = 'active'): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            // Kiểm tra game status
            if (game.status !== GameStatus.WAITING && role === 'active') {
                throw new Error("Cannot join active game as player");
            }

            let updatedGame: GameEntity;

            if (role === 'active') {
                // Kiểm tra player đã ở trong active players chưa
                if (game.activePlayerIds.includes(playerId)) {
                    return game;
                }

                // Kiểm tra số lượng player tối đa
                const maxPlayers = this.getMaxPlayersForGameMode(game.gameMode);
                if (game.activePlayerIds.length >= maxPlayers) {
                    throw new Error(`Game is full (max ${maxPlayers} players)`);
                }

                // Kiểm tra player có đang ở trong inactive không
                const updatedInactivePlayers = game.inActivePlayerIds.filter(id => id !== playerId);
                const updatedObserverPlayers = game.observerPlayerIds.filter(id => id !== playerId);

                // Thêm vào active players
                const updatedActivePlayers = [...game.activePlayerIds, playerId];

                updatedGame = await this.updateGame(gameId, {
                    activePlayerIds: updatedActivePlayers,
                    inActivePlayerIds: updatedInactivePlayers,
                    observerPlayerIds: updatedObserverPlayers
                }) as GameEntity;
            } else {
                // Thêm vào observer
                if (game.observerPlayerIds.includes(playerId)) {
                    return game;
                }

                const updatedObserverPlayers = [...game.observerPlayerIds, playerId];
                updatedGame = await this.updateGame(gameId, {
                    observerPlayerIds: updatedObserverPlayers
                }) as GameEntity;
            }

            return updatedGame;
        } catch (error: any) {
            console.error("Error adding player to game:", error);
            throw new Error(`Failed to add player to game: ${error.message}`);
        }
    }

    /**
     * Chuyển player từ active sang inactive (thua)
     */
    async movePlayerToInactive(gameId: string, playerId: string): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            // Kiểm tra game status
            if (game.status !== GameStatus.ACTIVE) {
                throw new Error("Cannot move player to inactive in non-active game");
            }

            // Kiểm tra player có trong active players không
            if (!game.activePlayerIds.includes(playerId)) {
                return game;
            }

            // Xóa khỏi active, thêm vào inactive
            const updatedActivePlayers = game.activePlayerIds.filter(id => id !== playerId);
            const updatedInactivePlayers = [...game.inActivePlayerIds, playerId];

            return await this.updateGame(gameId, {
                activePlayerIds: updatedActivePlayers,
                inActivePlayerIds: updatedInactivePlayers
            });
        } catch (error: any) {
            console.error("Error moving player to inactive:", error);
            throw new Error(`Failed to move player to inactive: ${error.message}`);
        }
    }

    /**
     * Rút card từ active deck
     */
    async drawCard(gameId: string, count: number = 1): Promise<{ cards: string[]; updatedGame: GameEntity | null }> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return { cards: [], updatedGame: null };
            }

            // Kiểm tra game status
            if (game.status !== GameStatus.ACTIVE) {
                throw new Error("Cannot draw card in non-active game");
            }

            if (game.activeDeck.length === 0) {
                // Nếu active deck hết, reset từ inactive deck
                const shuffledDeck = this.shuffleArray([...game.inActiveDeck]);
                const drawnCards = shuffledDeck.slice(0, Math.min(count, shuffledDeck.length));
                const remainingDeck = shuffledDeck.slice(count);

                const updatedGame = await this.updateGame(gameId, {
                    activeDeck: remainingDeck,
                    inActiveDeck: []
                });

                return { cards: drawnCards, updatedGame };
            }

            // Rút từ active deck
            const drawnCards = game.activeDeck.slice(0, Math.min(count, game.activeDeck.length));
            const remainingDeck = game.activeDeck.slice(count);

            const updatedGame = await this.updateGame(gameId, {
                activeDeck: remainingDeck,
                inActiveDeck: [...game.inActiveDeck, ...drawnCards]
            });

            return { cards: drawnCards, updatedGame };
        } catch (error: any) {
            console.error("Error drawing card:", error);
            throw new Error(`Failed to draw card: ${error.message}`);
        }
    }

    /**
     * Đảo chiều lượt chơi
     */
    async reverseTurnCycle(gameId: string): Promise<GameEntity | null> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            // Kiểm tra game status
            if (game.status !== GameStatus.ACTIVE) {
                throw new Error("Cannot reverse turn cycle in non-active game");
            }

            return await this.updateGame(gameId, {
                turnCicleClock: !game.turnCicleClock
            });
        } catch (error: any) {
            console.error("Error reversing turn cycle:", error);
            throw new Error(`Failed to reverse turn cycle: ${error.message}`);
        }
    }

    /**
     * Xóa game
     */
    async deleteGame(gameId: string): Promise<boolean> {
        try {
            const [result] = await mysqlPool.execute(
                `DELETE FROM ${this.TABLE_NAME} WHERE gameId = ?`,
                [gameId]
            );

            const deleteResult = result as any;
            return deleteResult.affectedRows > 0;
        } catch (error: any) {
            console.error("Error deleting game:", error);
            throw new Error(`Failed to delete game: ${error.message}`);
        }
    }

    /**
     * Kiểm tra player có trong game không
     */
    async isPlayerInGame(playerId: string, gameId?: string): Promise<boolean> {
        try {
            if (gameId) {
                const game = await this.findGameByGameId(gameId);
                if (!game) return false;

                return game.activePlayerIds.includes(playerId) ||
                    game.inActivePlayerIds.includes(playerId) ||
                    game.observerPlayerIds.includes(playerId);
            }

            const [rows] = await mysqlPool.execute(
                `SELECT COUNT(*) as count FROM ${this.TABLE_NAME} 
                 WHERE (JSON_CONTAINS(active_player_ids, ?) = 1 
                 OR JSON_CONTAINS(inactive_player_ids, ?) = 1 
                 OR JSON_CONTAINS(observer_player_ids, ?) = 1)
                 AND status != ?`,
                [`"${playerId}"`, `"${playerId}"`, `"${playerId}"`, GameStatus.FINISHED]
            );

            const result = rows as any[];
            return result[0]?.count > 0;
        } catch (error: any) {
            console.error("Error checking if player is in game:", error);
            throw new Error(`Failed to check if player is in game: ${error.message}`);
        }
    }

    /**
     * Lấy game summary
     */
    async getGameSummary(gameId: string): Promise<any> {
        try {
            const game = await this.findGameByGameId(gameId);
            if (!game) {
                return null;
            }

            return {
                gameId: game.gameId,
                roomId: game.roomId,
                gameMode: game.gameMode,
                status: game.status,
                activePlayersCount: game.activePlayerIds.length,
                inactivePlayersCount: game.inActivePlayerIds.length,
                observersCount: game.observerPlayerIds.length,
                activeDeckCount: game.activeDeck.length,
                inactiveDeckCount: game.inActiveDeck.length,
                turnCycle: game.turnCicleClock ? 'clockwise' : 'counterclockwise',
                isGameOver: game.status === GameStatus.FINISHED,
                canStart: game.status === GameStatus.WAITING && game.activePlayerIds.length >= 2,
                canJoin: game.status === GameStatus.WAITING &&
                    game.activePlayerIds.length < this.getMaxPlayersForGameMode(game.gameMode),
                createdAt: game.createdAt,
                updatedAt: game.updatedAt
            };
        } catch (error: any) {
            console.error("Error getting game summary:", error);
            throw new Error(`Failed to get game summary: ${error.message}`);
        }
    }

    /**
     * Helper methods
     */
    private generateGameId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `GAME-${timestamp}-${random}`.toUpperCase();
    }

    private getMaxPlayersForGameMode(gameMode: string): number {
        const maxPlayersMap: Record<string, number> = {
            'poker': 9,
            'blackjack': 7,
            'uno': 10,
            'rummy': 6,
            'default': 4
        };

        return maxPlayersMap[gameMode.toLowerCase()] || maxPlayersMap.default;
    }

    private generateDefaultDeck(gameMode: string): string[] {
        switch (gameMode.toLowerCase()) {
            case 'poker':
            case 'blackjack':
                return this.generateStandard52Deck();
            case 'uno':
                return this.generateUnoDeck();
            default:
                return this.generateStandard52Deck();
        }
    }

    private generateStandard52Deck(): string[] {
        const suits = ['♥', '♦', '♣', '♠'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck: string[] = [];

        for (const suit of suits) {
            for (const value of values) {
                deck.push(`${value}${suit}`);
            }
        }

        return this.shuffleArray(deck);
    }

    private generateUnoDeck(): string[] {
        const colors = ['R', 'G', 'B', 'Y']; // Red, Green, Blue, Yellow
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const actions = ['Skip', 'Reverse', 'Draw2'];
        const wilds = ['Wild', 'WildDraw4'];

        const deck: string[] = [];

        // Number cards (0-9 for each color)
        for (const color of colors) {
            // One zero per color
            deck.push(`${color}-0`);

            // Two of each 1-9 per color
            for (const number of numbers.slice(1)) {
                deck.push(`${color}-${number}`);
                deck.push(`${color}-${number}`);
            }

            // Action cards (2 of each per color)
            for (const action of actions) {
                deck.push(`${color}-${action}`);
                deck.push(`${color}-${action}`);
            }
        }

        // Wild cards (4 of each)
        for (const wild of wilds) {
            for (let i = 0; i < 4; i++) {
                deck.push(`W-${wild}`);
            }
        }

        return this.shuffleArray(deck);
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private mapToGameEntity(row: any): GameEntity {
        try {
            return {
                id: row.id.toString(),
                gameId: row.gameId,
                roomId: row.roomId,
                activeDeck: row.active_deck ? JSON.parse(row.active_deck) : [],
                inActiveDeck: row.inactive_deck ? JSON.parse(row.inactive_deck) : [],
                turnCicleClock: Boolean(row.turn_cicle_clock),
                currentPlayerId: row.current_player_id || '',
                activePlayerIds: row.active_player_ids ? JSON.parse(row.active_player_ids) : [],
                inActivePlayerIds: row.inactive_player_ids ? JSON.parse(row.inactive_player_ids) : [],
                observerPlayerIds: row.observer_player_ids ? JSON.parse(row.observer_player_ids) : [],
                gameMode: row.game_mode,
                status: row.status as GameStatus,
                createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
            };
        } catch (error) {
            console.error("Error mapping game entity:", error);
            throw new Error("Failed to map game entity");
        }
    }
}