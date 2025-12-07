import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Setup axios interceptor for automatic token refresh
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If error is 401 and we haven't retried yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        try {
                            const response = await api.post('/auth/refresh', { refreshToken });
                            const { token } = response.data;

                            localStorage.setItem('token', token);
                            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                            originalRequest.headers['Authorization'] = `Bearer ${token}`;

                            return api(originalRequest);
                        } catch (refreshError) {
                            console.error("Refresh token inválido ou expirado");
                            logout();
                            return Promise.reject(refreshError);
                        }
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    useEffect(() => {
        const recoverUser = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error("Token inválido ou expirado");
                    logout();
                }
            }

            setLoading(false);
        };

        recoverUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });

        const { token, refreshToken, user: userData } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(userData || { token });
    };

    const register = async (name, email, password) => {
        await api.post('/auth/register', { name, email, password });
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        try {
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error("Erro ao revogar token:", error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        api.defaults.headers.common['Authorization'] = undefined;

        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ authenticated: !!user, user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
