import axiosClient from "../axiosClient"

const serviceApiAuth = {
    signUp(body: { username: string, email: string, password: string }): any {
        return axiosClient.post("/auth/signup", body)
    },
    login(body: { username: string, password: string }): any {
        return axiosClient.post("/auth/login", body)
    },
    refreshAccessToken(body: { token: string }): any {
        return axiosClient.post("/auth/refresh-token", body)
    }
}

export default serviceApiAuth;