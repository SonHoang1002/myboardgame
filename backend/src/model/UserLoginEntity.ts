import { UserLogin } from "./UserLogin";

 

export interface UserLoginEntity extends UserLogin {
    // System generated fields
    id: number;
    passwordEncoded: string; // Hashed/encoded password
    createdAt: Date;
    updatedAt: Date;
    // Inherited optional fields with defaults
    // isActive: boolean;
    lastLogin: Date | null; 
}