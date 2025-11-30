import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
        } catch (err) {
            setError('Erro ao processar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="mb-4 text-center">Recuperar Senha</h2>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <p className="text-muted small">Digite seu e-mail para receber o link de redefinição.</p>
                    <input
                        type="email"
                        className="form-control"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Link'}
                </button>
            </form>
            <p className="mt-3 text-center">
                Lembrou a senha? <Link to="/login" className="text-decoration-none">Entrar</Link>
            </p>
        </div>
    );
};

export default ForgotPassword;
