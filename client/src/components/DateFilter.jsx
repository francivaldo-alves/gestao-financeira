import React from 'react';

const DateFilter = ({ currentMonth, currentYear, onMonthChange, onYearChange }) => {
    const months = [
        { value: 'all', label: 'Todos' },
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' },
    ];

    const currentYearInt = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYearInt - 2 + i);

    return (
        <div className="d-flex gap-2 align-items-center">
            <select
                className="form-select form-select-sm rounded-pill shadow-sm border-0"
                value={currentMonth}
                onChange={(e) => {
                    const val = e.target.value;
                    onMonthChange(val === 'all' ? 'all' : Number(val));
                }}
                style={{ width: '130px', cursor: 'pointer' }}
            >
                {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
            <select
                className="form-select form-select-sm rounded-pill shadow-sm border-0"
                value={currentYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                style={{ width: '100px', cursor: 'pointer' }}
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );
};

export default DateFilter;
