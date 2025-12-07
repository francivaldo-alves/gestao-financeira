const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { sequelize } = require("./models");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting middleware (will be activated after npm install)
// const rateLimit = require('express-rate-limit');
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Muitas requisições deste IP, tente novamente mais tarde.'
// });
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: 'Muitas tentativas de login, tente novamente mais tarde.'
// });
// app.use('/api/', generalLimiter);
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);


// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API do Sistema de Gestão Financeira");
  });
}

// Sync database and start server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Banco de dados conectado (sync alter).");
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro na conexão com o banco de dados:", err);
  });
