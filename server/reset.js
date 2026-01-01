require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const readline = require('readline');

// Import models
const User = require('./models/User');
const Student = require('./models/Student');
const Staff = require('./models/Staff');
const Grade = require('./models/Grade');
const Classroom = require('./models/Classroom');
const Attendance = require('./models/Attendance');
const Fee = require('./models/Fee');
const Schedule = require('./models/Schedule');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const resetDatabase = async () => {
    try {
        await connectDB();
        console.log('\n⚠️  WARNING: DATABASE RESET ⚠️\n');
        console.log('This will DELETE ALL data from your database:');

        // Count existing data
        const counts = {
            users: await User.countDocuments(),
            students: await Student.countDocuments(),
            staff: await Staff.countDocuments(),
            grades: await Grade.countDocuments(),
            classrooms: await Classroom.countDocuments(),
            attendance: await Attendance.countDocuments(),
            fees: await Fee.countDocuments(),
            schedules: await Schedule.countDocuments()
        };

        console.log(`   Users: ${counts.users}`);
        console.log(`   Students: ${counts.students}`);
        console.log(`   Staff: ${counts.staff}`);
        console.log(`   Grades: ${counts.grades}`);
        console.log(`   Classrooms: ${counts.classrooms}`);
        console.log(`   Attendance Records: ${counts.attendance}`);
        console.log(`   Fee Records: ${counts.fees}`);
        console.log(`   Schedules: ${counts.schedules}`);

        const answer = await askQuestion('\n❓ Are you ABSOLUTELY SURE you want to DELETE ALL this data? (yes/no): ');

        if (answer.toLowerCase() !== 'yes') {
            console.log('\n✅ Reset cancelled. Your data is safe.\n');
            rl.close();
            process.exit(0);
        }

        const confirmAgain = await askQuestion('\n❓ Type "DELETE ALL DATA" to confirm: ');

        if (confirmAgain !== 'DELETE ALL DATA') {
            console.log('\n✅ Reset cancelled. Your data is safe.\n');
            rl.close();
            process.exit(0);
        }

        console.log('\n🗑️  Deleting all data...');

        // Delete all data
        await User.deleteMany({});
        await Student.deleteMany({});
        await Staff.deleteMany({});
        await Grade.deleteMany({});
        await Classroom.deleteMany({});
        await Attendance.deleteMany({});
        await Fee.deleteMany({});
        await Schedule.deleteMany({});

        console.log('✅ All data deleted successfully.');
        console.log('💡 You can now run: node seed.js to create fresh seed data\n');

        rl.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        rl.close();
        process.exit(1);
    }
};

resetDatabase();
