const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME, // Nome do banco
  process.env.DB_USER, // Usuário
  process.env.DB_PASSWORD, // Senha
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
