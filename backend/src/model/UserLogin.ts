// entities/UserLogin.ts
export interface UserLogin {
    // Required fields
    username: string;
    email: string;
    password: string; 
    passwordEncoded: string;
    
    // Optional fields
    isActive?: boolean;
}


// For login request
export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

// For login response
export interface LoginResponse {
    success: boolean;
    token?: string;
    refreshToken?: string;
    user?: {
        id: number;
        username: string;
        email: string;
        lastLogin: Date;
    };
    message: string;
}

// For password change
export interface ChangePasswordRequest {
    userId: number;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// For password reset request
export interface ResetPasswordRequest {
    email: string;
    token?: string;
    newPassword?: string;
}