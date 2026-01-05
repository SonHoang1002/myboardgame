import { json } from "stream/consumers";
import { ThemeInterface } from "../../app/providers/ThemeContext";
import { stringify } from "querystring";

const LOCAL_STORAGE_KEY_THEME = "LOCAL_STORAGE_KEY_THEME 123123";
const LOCAL_STORAGE_KEY_LOCAL_DATA = "LOCAL_STORAGE_KEY_LOCAL_DATA 123123";



export const LocalStorageUtil = {
    // Kiểm tra xem đang sáng hay tối: true -> tối, false -> sáng
    getDarkThemeStatus(): boolean {
        var result = localStorage.getItem(LOCAL_STORAGE_KEY_THEME)
        if (result != null) {
            return JSON.parse(result) as boolean
        }
        return false
    },
    setTheme(isDarkMode: boolean): any {
        return localStorage.setItem(LOCAL_STORAGE_KEY_THEME, JSON.stringify(isDarkMode))
    },
    getLocalData(

    ): {
        accessToken: string,
        refreshToken: string,
        user: {}
    } {
        var result = localStorage.getItem(LOCAL_STORAGE_KEY_LOCAL_DATA);
        if (result != null) {
            return JSON.parse(result)
        }
        return {
            accessToken: "",
            refreshToken: "",
            user: {}
        }
    },
    setLocalData(
        data: {
            accessToken: string,
            refreshToken: string,
            user: string
        }
    ): any {
        return localStorage.setItem(LOCAL_STORAGE_KEY_LOCAL_DATA, JSON.stringify(data))

    }
}

export default LocalStorageUtil;


