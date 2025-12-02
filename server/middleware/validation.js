const { validationResult, check } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array().map(err => err.msg).join(', '),
            errors: errors.array()
        });
    }
    next();
};

const registerValidation = [
    check('name', 'O nome é obrigatório').not().isEmpty(),
    check('email', 'Inclua um e-mail válido').isEmail(),
    check('password', 'A senha deve ter 6 ou mais caracteres').isLength({ min: 6 })
];

const loginValidation = [
    check('email', 'Inclua um e-mail válido').isEmail(),
    check('password', 'A senha é obrigatória').exists()
];

const transactionValidation = [
    check('description', 'A descrição é obrigatória').not().isEmpty(),
    check('amount', 'O valor deve ser um número positivo').isFloat({ min: 0.01 }),
    check('type', 'O tipo deve ser income ou expense').isIn(['income', 'expense'])
];

const forgotPasswordValidation = [
    check('email', 'Inclua um e-mail válido').isEmail()
];

const resetPasswordValidation = [
    check('password', 'A senha deve ter 6 ou mais caracteres').isLength({ min: 6 })
];

const transactionUpdateValidation = [
    check('description', 'A descrição é obrigatória').optional().not().isEmpty(),
    check('amount', 'O valor deve ser um número positivo').optional().isFloat({ min: 0.01 }),
    check('type', 'O tipo deve ser income ou expense').optional().isIn(['income', 'expense'])
];

module.exports = {
    registerValidation,
    loginValidation,
    transactionValidation,
    transactionUpdateValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    validate
};
