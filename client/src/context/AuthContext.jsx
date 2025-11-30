import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const recoverUser = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                // 1. Configura o token no cabeçalho do Axios para requisições futuras
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // 2. Tenta recuperar os dados do usuário (Opcional, mas recomendado)
                try {
                    // Se você tiver uma rota '/auth/me' ou '/users/profile', use aqui:
                    // const response = await api.get('/auth/me'); 
                    // setUser(response.data);

                    // Por enquanto, assumimos que o token é válido:
                    setUser({ token });
                } catch (error) {
                    console.error("Token inválido ou expirado");
                    logout(); // Se o token for inválido, faz logout automático
                }
            }

            setLoading(false);
        };

        recoverUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });

        // Assumindo que o back retorna { token: '...', user: { name: '...', ... } }
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);

        // IMPORTANTE: Atualiza o header do axios imediatamente
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Se o back não retornar o objeto 'user', usamos apenas o token
        setUser(userData || { token });
    };

    const register = async (email, password) => {
        await api.post('/auth/register', { email, password });
    };

    const logout = () => {
        localStorage.removeItem('token');

        // IMPORTANTE: Limpa o header do axios
        api.defaults.headers.common['Authorization'] = undefined;
        // Ou: delete api.defaults.headers.common['Authorization'];

        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ authenticated: !!user, user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};