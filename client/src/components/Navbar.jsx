import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { logout, user } = useContext(AuthContext);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark shadow-sm mb-4" style={{ backgroundColor: '#1e293b' }}>
            <div className="container">
                <a className="navbar-brand fw-bold d-flex align-items-center text-white" href="/">
                    <img src="/favicon.png" alt="Logo" width="60" height="60" className="d-inline-block align-text-top me-2" />
                    <span style={{ letterSpacing: '0.5px' }}>Gestão Financeira</span>
                </a>

                <div className="d-flex align-items-center">
                    {user && (
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-light d-none d-md-block opacity-75">
                                Olá, <strong className="text-white">{user.name || 'Usuário'}</strong>
                            </span>
                            <button
                                onClick={logout}
                                className="btn btn-outline-light btn-sm rounded-pill px-3 hover-scale"
                                style={{ borderWidth: '1px' }}
                            >
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
