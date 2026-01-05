
// entities/RoomEntity.ts
import { Room } from "./Room";

export interface RoomEntity extends Room {
    // ID hệ thống
    id: number;
    // Thời gian tạo
    createdAt: Date;
    // Thời gian cập nhật
    updatedAt: Date;
}