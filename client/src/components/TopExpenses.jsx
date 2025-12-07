import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import { ThemeContext } from '../context/ThemeContext';

const TopExpenses = ({ transactions }) => {
    const { theme } = React.useContext(ThemeContext);
    const isDark = theme === 'dark';

    // Chart colors based on theme
    const axisColor = isDark ? '#adb5bd' : '#6c757d';
    const gridColor = isDark ? '#3a3f4b' : '#e0e0e0';
    const tooltipBg = isDark ? '#2d3139' : '#ffffff';
    const tooltipColor = isDark ? '#e4e6eb' : '#000000';
    const tooltipBorder = isDark ? '1px solid #3a3f4b' : 'none';

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
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={topExpenses}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: axisColor }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: tooltipBorder,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        backgroundColor: tooltipBg,
                                        color: tooltipColor
                                    }}
                                    itemStyle={{ color: tooltipColor }}
                                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                                    labelStyle={{ color: axisColor }}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                    {topExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="amount"
                                        position="top"
                                        formatter={(value) => `R$ ${value}`}
                                        style={{ fill: axisColor, fontSize: '12px', fontWeight: 'bold' }}
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
