import axios from "axios";

function setToken(t) {
    if (!t) return localStorage.removeItem("token");
    localStorage.setItem("token", t);
}

export const http = axios.create({
    baseURL: "",
    timeout: 300000,
    withCredentials: false
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

http.interceptors.response.use(
    (res) => {
        return res.data;
    },
    async (error) => {
        const status = error.response?.status;
        const data = error.response?.data;

        const apiError = {
            status,
            code: data?.code || "UNKNOWN_ERROR",
            message:
                data?.message ||
                error.message ||
                "Network error, please try again later",
        };

        if (status === 401) {
            setToken(null);
            // redirect to login page
            // window.location.href = '/login';
        }

        return Promise.reject(apiError);
    }
);