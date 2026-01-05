import { Router, Request, Response } from "express";
import { AuthRepository } from "../repository/auth.repository";
import { verifyToken } from "../middleware/validation";
import { encodePassword } from "../util/EncodeDecode";
import { UserLogin } from "../model/UserLogin";
import { STATUS_BAD_REQUEST_400, STATUS_CREATED_201, STATUS_FOUND_302, STATUS_INTERNAL_SERVER_ERROR_500, STATUS_NOT_FOUND_404, STATUS_OK_200, STATUS_UNAUTHORIZED_401 } from "../constant/common";
import { generateAccessToken, generateRefreshToken, verifyFreshToken } from "../util/TokenUtil";
import { TokenPayload } from "../type/token";

const authRouters = Router();

const authRepository = new AuthRepository();

/// Create new user from sign up action
authRouters.post("/signup", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const username = body.username;
        const email = body.email;
        const password = body.password;

        console.log("signup body: ", { username, email, password })
        // thông tin cơ bản ko được null 
        if (!username || !email || !password) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Username, email and password are required'
            });
        }
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,30}$/;

        if (!regex.test(password)) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Password must be 6-30 characters long, contain lowercase, uppercase and at least 1 special character'
            });
        }

        const passwordEncoded = encodePassword(password);
        const userData: UserLogin = {
            username,
            email,
            password,
            passwordEncoded,
        };
        const newUser = await authRepository.signUp(userData);

        res.status(STATUS_CREATED_201).json({
            success: true,
            data: newUser,
            message: 'User created successfully',
        });
    } catch (error: any) {
        console.error('Error creating user:', error);

        if (error.message.includes('already exists')) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: error.message,
            });
        }

        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
})

authRouters.post("/login", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const uid = body.uid;
        const username = body.username;
        const password = body.password;

        console.log("login data,", { username, password })

        // thông tin cơ bản ko được null 
        if (!username || !password) {
            return res.status(STATUS_BAD_REQUEST_400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        const passwordEncoded = encodePassword(password);
        const user = await authRepository.login(
            username,
            passwordEncoded
        );

        if (user != null) {
            const payload: TokenPayload = {
                uid: user.uid!,
                id: user.id,
                loginId: user.loginId!
            }
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);
            res.status(STATUS_OK_200).json({
                success: true,
                data: { user, accessToken, refreshToken, },
                message: 'Login successfully',
            });
        } else {
            res.status(STATUS_UNAUTHORIZED_401).json({
                success: false,
                message: "Login failed",
            });
        }

    } catch (error: any) {
        console.error('Error creating user:', error);
        res.status(STATUS_INTERNAL_SERVER_ERROR_500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
})

authRouters.post("/refresh-token", (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(STATUS_CREATED_201).json(
                {
                    success: false,
                    error: "Refresh token is required",
                }
            )
        }
        const tokenPayload = verifyFreshToken(refreshToken);
        console.log("Refresh token tokenPayload:", tokenPayload);
        const newPayload: TokenPayload = {
            uid: tokenPayload.uid,
            id: tokenPayload.id,
            loginId: tokenPayload.loginId,
        }
        const newAccessToken = generateAccessToken(newPayload);
        res.status(STATUS_OK_200).json(
            {
                success: true,
                accessToken: newAccessToken
            }
        )
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(STATUS_UNAUTHORIZED_401).json({
            success: false,
            error: "Invalid or expired refresh token",
        });
    }
})

authRouters.post("/protect", verifyToken, (req: Request, res: Response) => {
    try {
        res.status(STATUS_OK_200).json(
            {
                success: true,
                message: "Ok roi do"
            }
        )
    } catch (error) {
        return res.status(STATUS_BAD_REQUEST_400).json({
            success: false,
            error: "Protect bị lỗi",
        });
    }
})

export default authRouters;