import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
import ReceiptUpload from './ReceiptUpload';

export default function TransactionModal({ isOpen, onClose, initialForm, handleSubmit: onSubmit, editingId, handleCancelEdit }) {
    const [form, setForm] = useState(initialForm || {});
    const firstRef = useRef(null);
    const containerRef = useRef(null);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm(initialForm || {});
        }
    }, [isOpen, initialForm]);

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const handleScanComplete = (data) => {
        setForm(prev => ({
            ...prev,
            amount: data.amount || prev.amount,
            date: data.date || prev.date,
            description: data.description || prev.description,
        }));
    };

    const closeWithAnimation = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            onClose();
            setClosing(false);
        }, 220);
    }, [onClose]);

    const handleTabKey = useCallback((e) => {
        const modal = containerRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const current = document.activeElement;

        if (e.shiftKey) {
            if (current === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (current === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (firstRef.current) {
                firstRef.current.focus();
            }
        }, 100);

        const onKey = (e) => {
            if (e.key === 'Escape') closeWithAnimation();
            if (e.key === 'Tab') handleTabKey(e);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', onKey);
        }
    }, [isOpen, closeWithAnimation, handleTabKey]);

    if (!isOpen && !closing) return null;

    return (
        <>
            <div className={`modal-backdrop fade ${closing ? '' : 'show'}`} style={{ display: 'block' }} onClick={closeWithAnimation}></div>
            <div className={`modal fade ${closing ? '' : 'show'}`} style={{ display: 'block' }} role="dialog" aria-modal="true" onClick={closeWithAnimation}>
                <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
                    <div ref={containerRef} className="modal-content shadow-lg border-0 rounded-4">
                        {/* Header */}
                        <div className="modal-header border-bottom-0 pb-0">
                            <h5 className="modal-title fw-bold">{editingId ? 'Editar Transação' : 'Nova Transação'}</h5>
                            <button type="button" className="btn-close" onClick={closeWithAnimation} aria-label="Close"></button>
                        </div>

                        <div className="modal-body p-4">
                            {!editingId && (
                                <ReceiptUpload onScanComplete={handleScanComplete} />
                            )}

                            <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(form); closeWithAnimation(); }} className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Descrição *</label>
                                    <input
                                        ref={firstRef}
                                        type="text"
                                        name="description"
                                        placeholder="Ex: Salário, Aluguel, Mercado..."
                                        value={form.description}
                                        onChange={handleInputChange}
                                        required
                                        className="form-control"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Valor *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="0,00"
                                        value={form.amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="form-control"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Tipo</label>
                                    <select name="type" value={form.type} onChange={handleInputChange} className="form-select">
                                        <option value="income">Receita</option>
                                        <option value="expense">Despesa</option>
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Data</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleInputChange}
                                        className="form-control"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Categoria</label>
                                    <select name="category" value={form.category} onChange={handleInputChange} className="form-select">
                                        <option value="">Selecione uma categoria</option>
                                        {Object.entries(CATEGORIES).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Conta</label>
                                    <select name="paymentMethod" value={form.paymentMethod} onChange={handleInputChange} className="form-select">
                                        <option value="">Selecione uma conta</option>
                                        {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 d-flex align-items-center gap-4 flex-wrap">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" name="isRecurring" checked={!!form.isRecurring} onChange={handleInputChange} id="checkRecurring" />
                                        <label className="form-check-label small" htmlFor="checkRecurring">Transação Recorrente</label>
                                    </div>

                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" name="installments" checked={!!form.installments} onChange={handleInputChange} id="checkInstallments" />
                                        <label className="form-check-label small" htmlFor="checkInstallments">Parcelado</label>
                                    </div>

                                    {form.isRecurring && (
                                        <div className="d-flex align-items-center gap-2 ms-auto">
                                            <span className="small">Meses</span>
                                            <input
                                                type="number"
                                                name="recurrenceMonths"
                                                value={form.recurrenceMonths}
                                                onChange={handleInputChange}
                                                min={1}
                                                max={60}
                                                className="form-control form-control-sm"
                                                style={{ width: '80px' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <label className="form-label small fw-bold">Observações (opcional)</label>
                                    <textarea
                                        name="note"
                                        placeholder="Adicione uma observação"
                                        value={form.note}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        rows="3"
                                    />
                                </div>

                                <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                                    <button type="button" onClick={() => { if (handleCancelEdit) handleCancelEdit(); closeWithAnimation(); }} className="btn btn-outline-secondary rounded-pill px-4">Cancelar</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm">{editingId ? 'Salvar' : 'Adicionar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
