import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
    const { logout, user } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <nav className="navbar navbar-expand-lg shadow-sm mb-4" style={{ backgroundColor: 'var(--navbar-bg)' }}>
            <div className="container">
                <a className="navbar-brand fw-bold d-flex align-items-center" href="/" style={{ color: 'var(--text-color)' }}>
                    <img src="/favicon.png" alt="Logo" width="60" height="60" className="d-inline-block align-text-top me-2" />
                    <span style={{ letterSpacing: '0.5px' }}>Gestão Financeira</span>
                </a>

                <div className="d-flex align-items-center">
                    {user && (
                        <div className="d-flex align-items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="btn btn-outline-secondary btn-sm rounded-circle"
                                style={{ width: '38px', height: '38px', padding: '0' }}
                                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                            >
                                <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon'}-fill`}></i>
                            </button>
                            <span className="d-none d-md-block opacity-75" style={{ color: 'var(--text-color)' }}>
                                Olá, <strong>{user.name || 'Usuário'}</strong>
                            </span>
                            <button
                                onClick={logout}
                                className="btn btn-outline-danger btn-sm rounded-pill px-3 hover-scale"
                                style={{ borderWidth: '1px' }}
                            >
                                <i className="bi bi-box-arrow-right me-2"></i>
                                <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

