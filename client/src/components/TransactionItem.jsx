import React from 'react';
import { getCategoryIcon } from './Icons';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/constants';

const TransactionItem = ({ transaction, onEdit, onDelete, onCompleteSeries, onToggleComplete }) => {
    const { id, type, description, amount, date, category, paymentMethod, isRecurring, recurrenceId, completed, note } = transaction;

    const categoryData = CATEGORIES[category];
    const categoryLabel = categoryData ? categoryData.label : category;
    const categoryColor = categoryData ? categoryData.color : 'bg-light text-dark';
    const paymentLabel = PAYMENT_METHODS[paymentMethod] || paymentMethod;

    return (
        <div
            className={`list-group-item border rounded-4 mb-3 p-3 ${completed ? 'bg-light opacity-75' : 'bg-white shadow-sm'}`}
            style={{ transition: 'all 0.2s' }}
        >
            <div className="d-flex flex-column gap-3">
                {/* Top Row: Icon, Description, Amount */}
                <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                        <div
                            className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${type === 'income' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                            style={{ width: '48px', height: '48px' }}
                        >
                            {type === 'income' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            )}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className={`fw-bold lh-sm ${completed ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                                {description}
                            </div>
                            <div className="text-muted small">
                                {new Date(date).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>
                    <div className={`fw-bold text-nowrap flex-shrink-0 ${type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {type === 'income' ? '+' : '-'}{Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>

                {/* Middle Row: Badges & Note */}
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {category && (
                        <span className={`badge rounded-pill fw-normal d-flex align-items-center ${categoryColor}`}>
                            {getCategoryIcon(category)} {categoryLabel}
                        </span>
                    )}
                    {paymentMethod && (
                        <span className="badge bg-secondary-subtle text-secondary-emphasis fw-normal border">
                            {paymentLabel}
                        </span>
                    )}
                    {isRecurring && <span className="badge bg-warning-subtle text-warning-emphasis fw-normal">Recorrente</span>}

                    {note && <span className="small text-muted fst-italic ms-1 border-start ps-2">{note}</span>}
                </div>

                {/* Bottom Row: Actions */}
                <div className="d-flex flex-wrap align-items-center justify-content-between pt-2 border-top mt-1 gap-2">
                    <div className="form-check mb-0">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!completed}
                            onChange={(e) => onToggleComplete(transaction, e.target.checked)}
                            id={`check-${id}`}
                        />
                        <label className="form-check-label small text-muted" htmlFor={`check-${id}`}>Concluído</label>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                        <button onClick={() => onEdit(transaction)} className="btn btn-sm btn-outline-secondary px-2">
                            <i className="bi bi-pencil me-1"></i> Editar
                        </button>
                        <button onClick={() => onDelete(id)} className="btn btn-sm btn-outline-danger px-2">
                            <i className="bi bi-trash me-1"></i> Excluir
                        </button>
                        {recurrenceId && (
                            <button onClick={() => onCompleteSeries(recurrenceId)} className="btn btn-sm btn-outline-success px-2" title="Concluir Série">
                                <i className="bi bi-check-all me-1"></i> Concluir Série
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionItem;
