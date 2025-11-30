import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            await api.put(`/auth/reset-password/${token}`, { password });
            setMessage('Senha redefinida com sucesso! Redirecionando...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="mb-4 text-center">Redefinir Senha</h2>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Nova Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Confirmar Nova Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
            </form>
            <p className="mt-3 text-center">
                <Link to="/login" className="text-decoration-none">Voltar para Login</Link>
            </p>
        </div>
    );
};

export default ResetPassword;
