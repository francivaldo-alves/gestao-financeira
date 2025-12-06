import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import TopExpenses from '../components/TopExpenses';
import DateFilter from '../components/DateFilter';

const TopExpensesPage = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/transactions', {
                params: { month: currentMonth, year: currentYear }
            });
            setTransactions(response.data);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        } finally {
            setLoading(false);
        }
    }, [currentMonth, currentYear]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return (
        <div className="min-vh-100 bg-light">
            <Navbar />
            <div className="container mt-4">
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4 gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}
                        >
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1 className="h3 fw-bold text-dark mb-0">Análise de Gastos</h1>
                    </div>

                    <DateFilter
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        onMonthChange={setCurrentMonth}
                        onYearChange={setCurrentYear}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Carregando...</span>
                        </div>
                    </div>
                ) : (
                    <TopExpenses transactions={transactions} />
                )}
            </div>
        </div>
    );
};

export default TopExpensesPage;
