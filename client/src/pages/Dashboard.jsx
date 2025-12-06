import { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Toasts from '../components/Toasts';
import TransactionModal from '../components/TransactionModal';
import SummaryCards from '../components/SummaryCards';
import FilterBar from '../components/FilterBar';
import TransactionList from '../components/TransactionList';
import Navbar from '../components/Navbar';
import DateFilter from '../components/DateFilter';

const Dashboard = () => {
    const { logout } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // --- ESTADOS PARA OS MODAIS DE CONFIRMAÇÃO ---
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [recurrenceToComplete, setRecurrenceToComplete] = useState(null);

    const [initialFormData, setInitialFormData] = useState({
        description: '',
        amount: '',
        type: 'expense',
        date: '',
        category: '',
        paymentMethod: '',
        note: '',
        isRecurring: false,
        recurrenceMonths: 12
    });
    const [filter, setFilter] = useState('all');
    const [filterCategory, setFilterCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [includeCompleted, setIncludeCompleted] = useState(false);
    const [onlyRecurring, setOnlyRecurring] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/transactions', {
                params: { month: currentMonth, year: currentYear }
            });
            setTransactions(response.data);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            showToast('Erro ao carregar dados', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentMonth, currentYear]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((s) => [...s, { id, message, type }]);
        setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), 3500);
    };

    const handleSubmit = async (formData) => {
        const numericAmount = parseFloat(formData.amount);
        if (isNaN(numericAmount) || numericAmount < 0) {
            showToast('Valor inválido. Informe um número maior ou igual a 0.', 'error');
            return;
        }

        try {
            if (editingId) {
                await api.put(`/transactions/${editingId}`, { ...formData, amount: numericAmount });
                showToast('Transação atualizada', 'success');
                setEditingId(null);
            } else {
                await api.post('/transactions', { ...formData, amount: numericAmount });
                showToast('Transação adicionada', 'success');
            }
            fetchTransactions();
        } catch (error) {
            console.error('Erro ao salvar transação:', error);
            const msg = error?.response?.data?.error || 'Erro ao salvar transação.';
            showToast(msg, 'error');
        }
    };

    // --- LÓGICA DE EXCLUSÃO ---
    const handleDeleteClick = (id) => {
        setTransactionToDelete(id);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;

        try {
            await api.delete(`/transactions/${transactionToDelete}`);
            if (editingId === transactionToDelete) {
                setEditingId(null);
            }
            fetchTransactions();
            showToast('Transação excluída com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            showToast(error?.response?.data?.error || 'Erro ao excluir transação.', 'error');
        } finally {
            setTransactionToDelete(null);
        }
    };

    // --- LÓGICA DE CONCLUIR SÉRIE ---
    const handleCompleteSeriesClick = (recurrenceId) => {
        setRecurrenceToComplete(recurrenceId);
    };

    const confirmCompleteSeries = async () => {
        if (!recurrenceToComplete) return;

        // Optimistic update
        setTransactions(prevState => {
            if (!includeCompleted) {
                return prevState.filter(item => item.recurrenceId !== recurrenceToComplete);
            }
            return prevState.map(item => item.recurrenceId === recurrenceToComplete ? { ...item, completed: true } : item);
        });

        try {
            await api.put(`/transactions/recurrence/${recurrenceToComplete}/complete`, { completed: true });
            fetchTransactions();
            showToast('Todas recorrências marcadas como concluídas', 'success');
        } catch (err) {
            console.error('Erro ao marcar recorrência como concluída', err);
            fetchTransactions(); // Rollback via fetch
            showToast('Erro ao marcar recorrência', 'error');
        } finally {
            setRecurrenceToComplete(null);
        }
    };

    const handleEdit = (t) => {
        setEditingId(t.id);
        setInitialFormData({
            description: t.description || '',
            amount: t.amount || '',
            type: t.type || 'expense',
            date: t.date ? new Date(t.date).toISOString().slice(0, 10) : '',
            category: t.category || '',
            paymentMethod: t.paymentMethod || '',
            note: t.note || '',
            isRecurring: !!t.isRecurring
        });
        setIsModalOpen(true);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setInitialFormData({ description: '', amount: '', type: 'expense', date: '', category: '', paymentMethod: '', note: '', isRecurring: false });
    };

    const handleToggleComplete = async (t, checked) => {
        // Optimistic update
        setTransactions(prev => {
            if (checked && !includeCompleted) {
                return prev.filter(item => item.id !== t.id);
            }
            return prev.map(item => item.id === t.id ? { ...item, completed: checked } : item);
        });

        try {
            await api.put(`/transactions/${t.id}`, { completed: checked });
            fetchTransactions();
            showToast(checked ? 'Marcado como concluído' : 'Marcação removida', 'success');
        } catch (err) {
            console.error('Erro ao marcar concluído', err);
            fetchTransactions();
            showToast('Erro ao atualizar status', 'error');
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter !== 'all' && t.type !== filter) return false;
        if (filterCategory && t.category !== filterCategory) return false;
        if (!includeCompleted && t.completed) return false;
        if (onlyRecurring && !t.isRecurring) return false;
        return true;
    });

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncome - totalExpense;

    return (
        <div className="min-vh-100 bg-light">
            <Toasts toasts={toasts} />
            <Navbar />

            <main className="dashboard-container container">
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
                    <div>
                        <h1 className="display-6 fw-bold text-dark mb-0">Visão Geral</h1>
                        <p className="text-muted mt-1 mb-0">Gerencie suas finanças</p>
                    </div>
                    <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-3 flex-wrap">
                        <DateFilter
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onMonthChange={setCurrentMonth}
                            onYearChange={setCurrentYear}
                        />
                        <div className="d-flex gap-2 w-100 w-md-auto">
                            <button
                                onClick={() => window.location.href = '/maiores-gastos'}
                                className="btn btn-outline-primary rounded-pill px-4 shadow-sm flex-fill flex-md-grow-0"
                            >
                                <i className="bi bi-graph-up me-2"></i>
                                Ver Gráfico
                            </button>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setInitialFormData({ description: '', amount: '', type: 'expense', date: '', category: '', paymentMethod: '', note: '', isRecurring: false, recurrenceMonths: 12 });
                                    setIsModalOpen(true);
                                }}
                                className="btn btn-primary rounded-pill px-4 shadow-sm flex-fill flex-md-grow-0 text-nowrap"
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                Nova Transação
                            </button>
                        </div>
                    </div>
                </div>

                <SummaryCards balance={balance} totalIncome={totalIncome} totalExpense={totalExpense} />

                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialForm={initialFormData}
                    handleSubmit={handleSubmit}
                    editingId={editingId}
                    handleCancelEdit={handleCancelEdit}
                />

                {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
                {transactionToDelete && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow rounded-4">
                                <div className="modal-header border-bottom-0 pb-0">
                                    <h5 className="modal-title fw-bold text-danger">Excluir Transação</h5>
                                    <button type="button" className="btn-close" onClick={() => setTransactionToDelete(null)}></button>
                                </div>
                                <div className="modal-body">
                                    <p className="mb-0 text-muted">Tem certeza que deseja remover esta transação? <br />Esta ação não pode ser desfeita.</p>
                                </div>
                                <div className="modal-footer border-top-0 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-3" onClick={() => setTransactionToDelete(null)}>Cancelar</button>
                                    <button type="button" className="btn btn-danger rounded-pill px-4" onClick={confirmDelete}>Sim, Excluir</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODAL DE CONFIRMAÇÃO DE CONCLUIR SÉRIE --- */}
                {recurrenceToComplete && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow rounded-4">
                                <div className="modal-header border-bottom-0 pb-0">
                                    <h5 className="modal-title fw-bold text-success">Concluir Série Recorrente</h5>
                                    <button type="button" className="btn-close" onClick={() => setRecurrenceToComplete(null)}></button>
                                </div>
                                <div className="modal-body">
                                    <p className="mb-0 text-muted">Deseja marcar <strong>todas</strong> as transações desta recorrência como concluídas?</p>
                                    <p className="small text-muted mt-2 mb-0"><i className="bi bi-info-circle"></i> Isso afetará parcelas passadas e futuras.</p>
                                </div>
                                <div className="modal-footer border-top-0 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-3" onClick={() => setRecurrenceToComplete(null)}>Cancelar</button>
                                    <button type="button" className="btn btn-success rounded-pill px-4" onClick={confirmCompleteSeries}>Sim, Concluir</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-3 p-md-4">
                        <FilterBar
                            filter={filter}
                            setFilter={setFilter}
                            filterCategory={filterCategory}
                            setFilterCategory={setFilterCategory}
                            includeCompleted={includeCompleted}
                            setIncludeCompleted={setIncludeCompleted}
                            onlyRecurring={onlyRecurring}
                            setOnlyRecurring={setOnlyRecurring}
                        />

                        <TransactionList
                            transactions={filteredTransactions}
                            loading={loading}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onCompleteSeries={handleCompleteSeriesClick}
                            onToggleComplete={handleToggleComplete}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;