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
    const { type, month, year } = req.query;
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

    const transactions = await Transaction.findAll({
      where,
      order: [["date", "DESC"]],
    });
    res.json(transactions);
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
    } = req.body;

    // Se for recorrente, gerar um recurrenceId e criar múltiplos lançamentos
    const recurrenceMonths = parseInt(req.body.recurrenceMonths) || 12;
    const baseDate = date ? new Date(date) : new Date();

    if (isRecurring) {
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

module.exports = router;
