require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import models
const User = require('./models/User');
const Grade = require('./models/Grade');
const Classroom = require('./models/Classroom');

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...\n');

        // ⚠️ WARNING: Check if data already exists
        const existingUsers = await User.countDocuments();
        const existingGrades = await Grade.countDocuments();

        if (existingUsers > 0 || existingGrades > 0) {
            console.log('⚠️  WARNING: Database already contains data!');
            console.log(`   Users: ${existingUsers}`);
            console.log(`   Grades: ${existingGrades}`);
            console.log('\n❌ Seeding cancelled to prevent data loss.');
            console.log('💡 If you want to reset the database, use: node reset.js\n');
            process.exit(0);
        }

        console.log('✅ Database is empty. Proceeding with seed...\n');

        // Create Admin user
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@suzana.edu',
            password: '12345678',
            fullName: 'Administrator',
            role: 'admin',
            isActive: true
        });
        console.log('✅ Created Admin user:', adminUser.username);

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

            console.log(`✅ Created grade: ${grade.name} with classroom ${grade.name}-A`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Username: admin');
        console.log('   Password: 12345678\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
