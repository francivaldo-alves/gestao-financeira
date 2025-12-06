import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';

const TopExpenses = ({ transactions }) => {
    // Filtrar apenas despesas
    const expenses = transactions.filter(t => t.type === 'expense');

    // Ordenar por valor (maior para menor) e pegar os top 5
    const topExpenses = expenses
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(t => ({
            name: t.description,
            amount: t.amount,
            category: t.category
        }));

    const COLORS = ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545'];

    if (topExpenses.length === 0) {
        return null;
    }

    return (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
                <h5 className="card-title fw-bold text-secondary mb-4">Maiores Gastos do Mês</h5>
                <div className="d-flex justify-content-center">
                    <div style={{ width: '100%', maxWidth: `${topExpenses.length * 180}px`, height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={topExpenses}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#6c757d' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={120}>
                                    {topExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="amount"
                                        position="top"
                                        formatter={(value) => `R$ ${value}`}
                                        style={{ fill: '#6c757d', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopExpenses;
