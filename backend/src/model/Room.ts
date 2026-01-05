

// entities/Room.ts
export interface Room {
    // Id phòng (tự tạo)
    roomId: string;
    // Tên phòng
    roomName?: string;
    // Mô tả phòng
    description?: string;
    // Danh sách người chơi sẽ tham gia
    playerIds: string[];
    // Id của chủ phòng
    hostId: string;
    // Số người chơi tối đa
    maxPlayers?: number;
    // Số người chơi hiện tại (tính từ playerIds)
    currentPlayers?: number;
    // Trạng thái phòng đang được sử dụng
    isUsing: boolean;
    // Phòng riêng tư hay công khai
    isPrivate?: boolean;
    // Mật khẩu phòng (nếu là private)
    password?: string;
    // Chế độ game
    gameMode?: string;
    // Cài đặt game bổ sung
    gameSettings?: Record<string, any>;
    // Thời gian hết hạn phòng
    expiresAt?: Date;
    // Thời gian hoạt động cuối cùng
    lastActivityAt?: Date;
}



