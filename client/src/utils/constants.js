export const CATEGORIES = {
    salario: { label: 'Salário', color: 'bg-success-subtle text-success-emphasis' },
    alimentacao: { label: 'Alimentação', color: 'bg-warning-subtle text-warning-emphasis' },
    transporte: { label: 'Transporte', color: 'bg-primary-subtle text-primary-emphasis' },
    moradia: { label: 'Moradia', color: 'bg-info-subtle text-info-emphasis' },
    lazer: { label: 'Lazer', color: 'bg-danger-subtle text-danger-emphasis' },
    saude: { label: 'Saúde', color: 'bg-success-subtle text-success-emphasis' },
    outros: { label: 'Outros', color: 'bg-light text-dark' }
};

export const PAYMENT_METHODS = {
    cash: 'Dinheiro',
    card: 'Cartão',
    boleto: 'Boleto',
    pix: 'Pix',
    transfer: 'Transferência',
    other: 'Outro'
};

export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense'
};
