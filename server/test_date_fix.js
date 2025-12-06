const { Sequelize, Op } = require('sequelize');
const db = require('./models');
const { Transaction, User } = db;

async function testDateFix() {
    try {
        console.log('Connecting to DB...');
        // Ensure DB connection
        await db.sequelize.authenticate();
        console.log('Connected.');

        // 1. Create a test user
        const user = await User.create({
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            name: 'Test User'
        });
        console.log('Test user created:', user.id);

        // 2. Create a transaction on the last day of the month (e.g., 2025-01-31 23:59:59)
        // Note: The issue was that "between" [start, end] where end is 2025-01-31 00:00:00 would miss transactions later in the day.
        // Or if end was 2025-01-31 23:59:59.999 it might work, but my fix uses < Next Month Start.

        const year = 2025;
        const month = 1; // January
        const lastDay = new Date(year, month - 1, 31, 23, 59, 59); // Jan 31 23:59:59

        await Transaction.create({
            description: 'Last Day Transaction',
            amount: 100,
            type: 'expense',
            date: lastDay,
            userId: user.id
        });
        console.log('Transaction created on:', lastDay);

        // 3. Run the query logic (simulating the fixed backend logic)
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1); // Feb 1st (Start of next month)

        console.log('Querying range:', startDate, 'to', endDate, '(exclusive)');

        const transactions = await Transaction.findAll({
            where: {
                userId: user.id,
                date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        });

        console.log('Transactions found:', transactions.length);

        if (transactions.length === 1) {
            console.log('SUCCESS: Transaction found!');
        } else {
            console.error('FAILURE: Transaction NOT found!');
            process.exit(1);
        }

        // Cleanup
        await Transaction.destroy({ where: { userId: user.id } });
        await User.destroy({ where: { id: user.id } });

    } catch (error) {
        console.error('Test failed with error:', error);
        process.exit(1);
    } finally {
        await db.sequelize.close();
    }
}

testDateFix();
