// entities/UserEntity.ts
import { User } from "./User";

export interface UserEntity extends User {
    // System generated fields
    id: number;
    createdAt: Date;
    updatedAt: Date;
}