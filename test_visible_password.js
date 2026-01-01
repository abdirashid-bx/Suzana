const mongoose = require('mongoose');
const User = require('./server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const testPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const testEmail = 'test_viz_pwd@example.com';

        // Cleanup previous test
        await User.deleteOne({ email: testEmail });

        // 1. Create User
        console.log('Creating user...');
        const user = new User({
            username: 'test_viz',
            email: testEmail,
            password: 'secretPassword123',
            fullName: 'Test Visibility',
            role: 'teacher'
        });
        await user.save();
        console.log('User created.');

        // 2. Fetch User WITHOUT explicit select (should NOT have visiblePassword)
        const userNormal = await User.findOne({ email: testEmail });
        console.log('Normal fetch visiblePassword:', userNormal.visiblePassword);

        // 3. Fetch User WITH explicit select (SHOULD have visiblePassword)
        const userAdmin = await User.findOne({ email: testEmail }).select('+visiblePassword');
        console.log('Admin fetch visiblePassword:', userAdmin.visiblePassword);

        // 4. Verify match
        if (userAdmin.visiblePassword === 'secretPassword123') {
            console.log('SUCCESS: Password is visible and correct.');
        } else {
            console.log('FAILURE: Password mismatch or missing.');
        }

        // Cleanup
        await User.deleteOne({ email: testEmail });
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testPassword();
