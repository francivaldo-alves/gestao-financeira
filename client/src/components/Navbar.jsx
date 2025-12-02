import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { logout, user } = useContext(AuthContext);

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
            <div className="container">
                <a className="navbar-brand fw-bold text-primary" href="/">
                    <i className="bi bi-wallet2 me-2"></i>
                    Gestão Financeira
                </a>
                
                <div className="d-flex align-items-center">
                    {user && (
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-muted d-none d-md-block">
                                Olá, {user.name || 'Usuário'}
                            </span>
                            <button 
                                onClick={logout} 
                                className="btn btn-outline-danger btn-sm rounded-pill px-3"
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
