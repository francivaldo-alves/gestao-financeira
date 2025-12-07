module.exports = (sequelize, DataTypes) => {
    const Budget = sequelize.define("Budget", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        monthlyLimit: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 12,
            },
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'category', 'month', 'year']
            }
        ]
    });

    Budget.associate = (models) => {
        Budget.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
        });
    };

    return Budget;
};
