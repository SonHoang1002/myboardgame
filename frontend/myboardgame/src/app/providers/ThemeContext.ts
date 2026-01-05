import { createContext } from "react";

export interface ThemeInterface {
    isDark: boolean,
    toggle: () => void
}

const initThemeContext: ThemeInterface = {
    isDark: true,
    toggle: () => {}
}

export const ContextTheme = createContext<ThemeInterface>(initThemeContext)