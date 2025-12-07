const express = require("express");
const { Transaction } = require("../models");
const { randomUUID } = require("crypto");
const auth = require("../middleware/auth");
const { Op } = require("sequelize");
const { validate, transactionValidation, transactionUpdateValidation } = require("../middleware/validation");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const { type, month, year, page = 1, limit = 50 } = req.query;
    const where = { userId: req.user.id };

    if (type) {
      where.type = type;
    }

    if (month && year) {
      let startDate, endDate;

      if (month === 'all') {
        startDate = new Date(year, 0, 1);
        // Start of next year
        endDate = new Date(parseInt(year) + 1, 0, 1);
      } else {
        startDate = new Date(year, month - 1, 1);
        // Start of next month
        endDate = new Date(year, month, 1);
      }

      where.date = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      order: [["date", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      transactions,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Create transaction
router.post("/", transactionValidation, validate, async (req, res) => {
  try {
    const {
      type,
      amount,
      description,
      date,
      category,
      paymentMethod,
      note,
      isRecurring,
      installments,
    } = req.body;

    const baseDate = date ? new Date(date) : new Date();

    // Handle installments
    if (installments && req.body.totalInstallments > 1) {
      const totalInstallments = parseInt(req.body.totalInstallments);
      const installmentId = randomUUID();
      const installmentAmount = parseFloat(amount) / totalInstallments;

      const installmentTransactions = [];
      for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        installmentTransactions.push({
          type,
          amount: installmentAmount,
          description: `${description} (${i + 1}/${totalInstallments})`,
          date: installmentDate,
          category: category || null,
          paymentMethod: paymentMethod || null,
          note: note || null,
          installmentNumber: i + 1,
          totalInstallments,
          installmentId,
          userId: req.user.id,
        });
      }

      await Transaction.bulkCreate(installmentTransactions);

      return res
        .status(201)
        .json({ message: "Transações parceladas criadas.", installmentId });
    }

    // Handle recurring transactions
    if (isRecurring) {
      const recurrenceMonths = parseInt(req.body.recurrenceMonths) || 12;
      const recurrenceId = randomUUID();

      // Criar o lançamento atual com recurrenceId
      const created = await Transaction.create({
        type,
        amount,
        description,
        date: baseDate,
        category: category || null,
        paymentMethod: paymentMethod || null,
        note: note || null,
        isRecurring: true,
        recurrenceId,
        userId: req.user.id,
      });

      // Gerar os lançamentos futuros (meses seguintes)
      const future = [];
      for (let i = 1; i < recurrenceMonths; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        future.push({
          type,
          amount,
          description,
          date: d,
          category: category || null,
          paymentMethod: paymentMethod || null,
          note: note || null,
          isRecurring: true,
          completed: false,
          recurrenceId,
          userId: req.user.id,
        });
      }

      if (future.length > 0) {
        await Transaction.bulkCreate(future);
      }

      return res
        .status(201)
        .json({ message: "Transações recorrentes criadas.", recurrenceId });
    }

    // Single transaction
    const transaction = await Transaction.create({
      type,
      amount,
      description,
      date: baseDate,
      category: category || null,
      paymentMethod: paymentMethod || null,
      note: note || null,
      isRecurring: false,
      userId: req.user.id,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update transaction
router.put("/:id", transactionUpdateValidation, validate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      description,
      date,
      category,
      paymentMethod,
      note,
      isRecurring,
    } = req.body;

    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    const hadRecurrence = !!transaction.recurrenceId;

    await transaction.update({
      type,
      amount,
      description,
      date,
      category,
      paymentMethod,
      note,
      isRecurring,
      completed:
        req.body.completed !== undefined
          ? !!req.body.completed
          : transaction.completed,
    });

    // Se agora é recorrente e antes não tinha recurrenceId, gerar lançamentos futuros
    if (isRecurring && !hadRecurrence) {
      const recurrenceMonths = parseInt(req.body.recurrenceMonths) || 12;
      const recurrenceId = randomUUID();
      const baseDate = date ? new Date(date) : new Date(transaction.date);

      const future = [];
      for (let i = 1; i < recurrenceMonths; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        future.push({
          type: type || transaction.type,
          amount,
          description: description || transaction.description,
          date: d,
          category: category || transaction.category,
          paymentMethod: paymentMethod || transaction.paymentMethod,
          note: note || transaction.note,
          isRecurring: true,
          recurrenceId,
          userId: req.user.id,
        });
      }

      if (future.length > 0) await Transaction.bulkCreate(future);
      // atualizar a transação atual com recurrenceId
      await transaction.update({ recurrenceId });
    }

    // Recarregar a instância para garantir dados atualizados
    await transaction.reload();

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    await transaction.destroy();
    res.json({ message: "Transação excluída." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all transactions in a recurrence as completed/uncompleted
router.put("/recurrence/:recurrenceId/complete", async (req, res) => {
  try {
    const { recurrenceId } = req.params;
    const setCompleted =
      req.body.completed === undefined ? true : !!req.body.completed;

    const [updatedCount] = await Transaction.update(
      { completed: setCompleted },
      { where: { recurrenceId, userId: req.user.id } }
    );

    const updated = await Transaction.findAll({
      where: { recurrenceId, userId: req.user.id },
      order: [["date", "DESC"]],
    });

    return res.json({
      message: `${updatedCount} transações atualizadas.`,
      updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export transactions as CSV
router.get("/export", async (req, res) => {
  try {
    const { type, month, year } = req.query;
    const where = { userId: req.user.id };

    if (type) {
      where.type = type;
    }

    if (month && year) {
      let startDate, endDate;

      if (month === 'all') {
        startDate = new Date(year, 0, 1);
        endDate = new Date(parseInt(year) + 1, 0, 1);
      } else {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 1);
      }

      where.date = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }

    const transactions = await Transaction.findAll({
      where,
      order: [["date", "DESC"]],
    });

    // Convert to CSV format
    const csvHeader = "Data,Descrição,Tipo,Valor,Categoria,Forma de Pagamento,Observações\n";
    const csvRows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      const type = t.type === 'income' ? 'Receita' : 'Despesa';
      const amount = t.amount.toFixed(2).replace('.', ',');
      return `${date},"${t.description}",${type},${amount},"${t.category || ''}","${t.paymentMethod || ''}","${t.note || ''}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transacoes_${month || 'todas'}_${year || new Date().getFullYear()}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

