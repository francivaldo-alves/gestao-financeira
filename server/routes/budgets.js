const express = require("express");
const { Budget } = require("../models");
const auth = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all budgets for current user
router.get("/", async (req, res) => {
    try {
        const { month, year } = req.query;
        const where = { userId: req.user.id };

        if (month) where.month = parseInt(month);
        if (year) where.year = parseInt(year);

        const budgets = await Budget.findAll({
            where,
            order: [["category", "ASC"]],
        });

        res.json(budgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update budget
router.post("/", async (req, res) => {
    try {
        const { category, monthlyLimit, month, year } = req.body;

        if (!category || !monthlyLimit || !month || !year) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios" });
        }

        const [budget, created] = await Budget.findOrCreate({
            where: {
                userId: req.user.id,
                category,
                month: parseInt(month),
                year: parseInt(year),
            },
            defaults: {
                monthlyLimit: parseFloat(monthlyLimit),
            },
        });

        if (!created) {
            await budget.update({ monthlyLimit: parseFloat(monthlyLimit) });
        }

        res.status(created ? 201 : 200).json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete budget
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await Budget.findOne({
            where: { id, userId: req.user.id },
        });

        if (!budget) {
            return res.status(404).json({ error: "Meta não encontrada" });
        }

        await budget.destroy();
        res.json({ message: "Meta excluída" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
