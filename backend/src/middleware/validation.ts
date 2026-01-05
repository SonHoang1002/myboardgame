import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { verifyAccessToken } from '../util/TokenUtil';
import { STATUS_UNAUTHORIZED_401 } from '../constant/common';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        // const authHeader = req.headers.authorization;
        // const accessToken = authHeader && authHeader.split(' ')[1];
        // if (!accessToken) {
        //     return res.status(STATUS_UNAUTHORIZED_401).json({ error: 'Access token not provided' });
        // }
        // const tokenPayload = verifyAccessToken(accessToken);
        // req.body.uid = tokenPayload.uid 
        next();
    } catch (error) {
        return res.status(STATUS_UNAUTHORIZED_401).json({ success: false, error: "Invalid token" });
    }
}


