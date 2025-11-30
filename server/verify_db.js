const { User } = require('./models');

async function verify() {
    try {
        // Check table description (columns)
        const tableInfo = await User.describe();
        console.log('User Table Columns:', Object.keys(tableInfo));

        // List users
        const users = await User.findAll();
        console.log('Users found:', users.map(u => u.email));

    } catch (error) {
        console.error('Error verifying DB:', error);
    }
}

verify();
