const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    port: process.env.DB_PORT || 5432,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./User.js')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./Transaction.js')(sequelize, Sequelize.DataTypes);
db.RefreshToken = require('./RefreshToken.js')(sequelize, Sequelize.DataTypes);
db.Budget = require('./Budget.js')(sequelize, Sequelize.DataTypes);


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
