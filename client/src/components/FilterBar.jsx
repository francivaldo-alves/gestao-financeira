import React from 'react';
import { CATEGORIES } from '../utils/constants';

const FilterBar = ({ filter, setFilter, filterCategory, setFilterCategory, includeCompleted, setIncludeCompleted, onlyRecurring, setOnlyRecurring }) => {
    return (
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between mb-4 gap-3">
            <h3 className="h5 fw-bold mb-0">Transações</h3>
            <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-select form-select-sm rounded-pill flex-grow-1">
                    <option value="all">Todas</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                </select>

                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select form-select-sm rounded-pill flex-grow-1">
                    <option value="">Todas categorias</option>
                    {Object.entries(CATEGORIES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                <div className="d-flex align-items-center gap-3 justify-content-between justify-content-sm-start border rounded-pill px-3 py-1 bg-white">
                    <div className="form-check mb-0">
                        <input className="form-check-input" type="checkbox" checked={includeCompleted} onChange={(e) => { setIncludeCompleted(e.target.checked) }} id="checkCompleted" />
                        <label className="form-check-label small text-muted" htmlFor="checkCompleted">Concluídas</label>
                    </div>

                    <div className="vr mx-2"></div>

                    <div className="form-check mb-0">
                        <input className="form-check-input" type="checkbox" checked={onlyRecurring} onChange={(e) => { setOnlyRecurring(e.target.checked) }} id="checkRecurringFilter" />
                        <label className="form-check-label small text-muted" htmlFor="checkRecurringFilter">Recorrentes</label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
