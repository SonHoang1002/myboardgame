import { createContext } from "react";
import { UserEntity } from "../../entities/UserEntity";

export interface LocalDataInterface {
    accessToken: string,
    refreshToken: string,
    user: UserEntity,
    onUpdateUser: (user: UserEntity) => void,
    onUpdateAccessToken: (newAccessToken: string) => void,
    onUpdateRefreshToken: (newRefeshToken: string) => void,
    onUpdateAll: (
        { accessToken, refreshToken, user }:
            { accessToken: string, refreshToken: string, user: UserEntity, }) => void,
}

const initLocalDataContext: LocalDataInterface | null = null

export const ContextLocalData = createContext<LocalDataInterface | null>(initLocalDataContext)