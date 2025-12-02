const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { sequelize } = require("./models");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "index.html"));
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
