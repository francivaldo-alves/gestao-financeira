import React from 'react';
import TransactionItem from './TransactionItem';

const TransactionList = ({ transactions, loading, onEdit, onDelete, onCompleteSeries, onToggleComplete }) => {
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-5 text-muted border rounded-3 bg-white">
                <p className="mb-0">Nenhuma transação encontrada.</p>
            </div>
        );
    }

    return (
        <div className="list-group list-group-flush">
            {transactions.map(t => (
                <TransactionItem
                    key={t.id}
                    transaction={t}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCompleteSeries={onCompleteSeries}
                    onToggleComplete={onToggleComplete}
                />
            ))}
        </div>
    );
};

export default TransactionList;
