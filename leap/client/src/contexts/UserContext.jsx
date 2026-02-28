import { createContext, useContext, useState, useEffect } from 'react';
import { getUserInfo, login as loginApi, register as registerApi, logout as logoutApi } from '../api/user';
const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await getUserInfo();
                    if (res.success) {
                        setUser(res.data.user);
                    }
                } catch (err) {
                    console.error("Initialize user info failed:", err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await loginApi(email, password);
            if (res.success) {
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
                return true;
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message || "Login failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await logoutApi();
        setUser(null);
    };

    const register = async (email, password, role) => {
        setLoading(true);
        setError(null);
        try {
            const res = await registerApi(email, password, role);
            if (res.success) {
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                    setUser(res.data.user);
                }
                return true;
            }
        } catch (err) {
            console.error("Registration failed:", err);
            setError(err.message || "Registration failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserContext.Provider value={{ user, login, logout, register, loading, error }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};