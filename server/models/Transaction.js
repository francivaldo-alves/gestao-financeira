module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM(
        "cash",
        "card",
        "boleto",
        "pix",
        "transfer",
        "other"
      ),
      allowNull: true,
    },
    recurrenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Transaction;
};
