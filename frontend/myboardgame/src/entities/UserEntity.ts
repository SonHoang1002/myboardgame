export interface UserEntity {
  id: number;
  nameInGame: string;
  loginId: number;
  // Optional fields
  uid: string;
  status: number; // 0: offline, 1: online, 2: in-game, 3: busy
  location: string;
  avatarUrl: string;
  phone: string;
  bio: string;
  totalGamesPlayed: number;
  totalGamesWon: number;
  gold: number;
  experiencePoints: number;
  level: number;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}