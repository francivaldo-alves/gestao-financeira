import React from 'react';
import { IconCardBalance, IconCardIncome, IconCardExpense } from './Icons';

const SummaryCards = ({ balance, totalIncome, totalExpense }) => {
    return (
        <div className="row g-3 mb-4">
            {/* Card: Saldo Total */}
            <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                    <div className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between">
                        <div>
                            <h6 className="text-muted text-uppercase fw-bold small mb-1">Saldo Total</h6>
                            <h2 className="fs-1 fw-bold text-dark mb-0">
                                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h2>
                        </div>
                        <div className="bg-primary-subtle text-primary rounded-4 p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                            <IconCardBalance />
                        </div>
                    </div>
                    <div className="position-absolute bottom-0 start-0 w-100 bg-primary" style={{ height: '4px' }}></div>
                </div>
            </div>

            {/* Card: Receitas do Mês */}
            <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                    <div className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between">
                        <div>
                            <h6 className="text-muted text-uppercase fw-bold small mb-1">Receitas do Mês</h6>
                            <h2 className="fs-2 fw-bold text-success mb-0">
                                {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h2>
                        </div>
                        <div className="bg-success-subtle text-success rounded-4 p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                            <IconCardIncome />
                        </div>
                    </div>
                    <div className="position-absolute bottom-0 start-0 w-100 bg-success" style={{ height: '4px' }}></div>
                </div>
            </div>

            {/* Card: Total das Despesas */}
            <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                    <div className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between">
                        <div>
                            <h6 className="text-muted text-uppercase fw-bold small mb-1">Despesas do Mês</h6>
                            <h2 className="fs-2 fw-bold text-danger mb-0">
                                {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h2>
                        </div>
                        <div className="bg-danger-subtle text-danger rounded-4 p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                            <IconCardExpense />
                        </div>
                    </div>
                    <div className="position-absolute bottom-0 start-0 w-100 bg-danger" style={{ height: '4px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;
