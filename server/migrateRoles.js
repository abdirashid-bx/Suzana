require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected for migration');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Migration function
const migrateRoles = async () => {
    try {
        console.log('\n🔄 Starting role migration...\n');

        // Find all users with super_admin role
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const superAdmins = await User.find({ role: 'super_admin' });

        console.log(`📊 Found ${superAdmins.length} super_admin user(s) to migrate:\n`);

        if (superAdmins.length === 0) {
            console.log('✅ No super_admin users found. Nothing to migrate.');
            return;
        }

        // Display users that will be migrated
        superAdmins.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.fullName} (${user.username}) - ${user.email}`);
        });

        console.log('\n🔄 Updating roles from "super_admin" to "admin"...\n');

        // Update all super_admin to admin
        const result = await User.updateMany(
            { role: 'super_admin' },
            { $set: { role: 'admin' } }
        );

        console.log(`✅ Migration completed successfully!`);
        console.log(`   - Modified: ${result.modifiedCount} user(s)`);
        console.log(`   - Matched: ${result.matchedCount} user(s)\n`);

        // Verify migration
        const remainingSuperAdmins = await User.find({ role: 'super_admin' });
        const newAdmins = await User.find({
            role: 'admin',
            _id: { $in: superAdmins.map(u => u._id) }
        });

        console.log('🔍 Verification:');
        console.log(`   - Remaining super_admins: ${remainingSuperAdmins.length}`);
        console.log(`   - Successfully migrated to admin: ${newAdmins.length}\n`);

        if (remainingSuperAdmins.length === 0 && newAdmins.length === superAdmins.length) {
            console.log('✅ All checks passed! Migration was successful.\n');
        } else {
            console.log('⚠️  Warning: Some users may not have been migrated correctly.\n');
        }

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    }
};

// Run migration
const run = async () => {
    try {
        await connectDB();
        await migrateRoles();
        console.log('🎉 Migration process completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error during migration:', error);
        process.exit(1);
    }
};

run();
