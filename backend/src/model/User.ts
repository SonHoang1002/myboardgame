// entities/User.ts
export interface User {
    // Required fields
    nameInGame: string;
    loginId: number;
    // Optional fields
    uid?: string;
    status?: number; // 0: offline, 1: online, 2: in-game, 3: busy
    location?: string;
    avatarUrl?: string;
    phone?: string;
    bio?: string;
    totalGamesPlayed?: number;
    totalGamesWon?: number;
    gold?: number;
    experiencePoints?: number;
    level?: number;
    lastSeenAt?: Date;
}

// For user status updates
export interface UserStatusUpdate {
    userId: number;
    status: number;
    location?: string;
}

// For user statistics
export interface UserStats {
    totalGamesPlayed: number;
    totalGamesWon: number;
    winRate: number;
    experiencePoints: number;
    level: number;
    rank?: number;
}
