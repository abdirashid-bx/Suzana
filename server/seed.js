require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Import models
const User = require('./models/User');
const Grade = require('./models/Grade');
const Classroom = require('./models/Classroom');

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany({});
        await Grade.deleteMany({});
        await Classroom.deleteMany({});
        console.log('Cleared existing data...');

        // Create Super Admin user
        const superAdmin = await User.create({
            username: 'superAdmin',
            email: 'admin@suzana.edu',
            password: '12345678',
            fullName: 'Super Administrator',
            role: 'super_admin',
            isActive: true
        });
        console.log('Created Super Admin user:', superAdmin.username);

        // Create initial grades
        const gradesData = [
            { name: 'Baby Care', order: 1, description: 'Infant care and early development' },
            { name: 'Play Group', order: 2, description: 'Early childhood play-based learning' },
            { name: 'PP1', order: 3, description: 'Pre-Primary 1' },
            { name: 'PP2', order: 4, description: 'Pre-Primary 2' },
            { name: 'Grade 1', order: 5, description: 'Primary Grade 1' }
        ];

        for (const gradeData of gradesData) {
            const grade = await Grade.create(gradeData);

            // Create initial classroom for each grade
            await Classroom.create({
                grade: grade._id,
                name: `${grade.name}-A`,
                suffix: 'A',
                capacity: 29,
                currentCount: 0
            });

            console.log(`Created grade: ${grade.name} with classroom ${grade.name}-A`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Username: superAdmin');
        console.log('   Password: 12345678');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
