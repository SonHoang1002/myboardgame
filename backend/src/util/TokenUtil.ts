import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import { TokenPayload } from "../type/token";

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (accessToken: string): TokenPayload => {
  return jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
};


export const verifyFreshToken = (refreshToken: string): TokenPayload => {
  return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
};




