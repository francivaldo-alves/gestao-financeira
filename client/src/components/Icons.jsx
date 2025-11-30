import React from 'react';

export const IconSalario = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" />
    </svg>
);

export const IconAlimentacao = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h10v4H7z" />
    </svg>
);

export const IconTransporte = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h18l-2 6H5l-2-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13V7h10v6" />
    </svg>
);

export const IconMoradia = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l9-7 9 7v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" />
    </svg>
);

export const IconLazer = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2 5 5 .5-4 3 1.5 5L12 13l-4.5 3L9 10 5 7.5 10 7z" />
    </svg>
);

export const IconSaude = ({ style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8M8 12h8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const IconIncome = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export const IconExpense = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export const IconCardIncome = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);

export const IconCardExpense = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
);

export const IconCardBalance = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

export const getCategoryIcon = (category) => {
    const style = { width: '14px', height: '14px', display: 'inline-block', marginRight: '4px' };
    switch (category) {
        case 'salario': return <IconSalario style={style} />;
        case 'alimentacao': return <IconAlimentacao style={style} />;
        case 'transporte': return <IconTransporte style={style} />;
        case 'moradia': return <IconMoradia style={style} />;
        case 'lazer': return <IconLazer style={style} />;
        case 'saude': return <IconSaude style={style} />;
        default: return null;
    }
};
