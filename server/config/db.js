const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connection options for stability and performance
        const options = {
            maxPoolSize: 10, // Maximum number of connections
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            retryWrites: true, // Retry failed writes
            w: 'majority' // Write concern: majority of nodes must acknowledge
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Connection event handlers for monitoring
        mongoose.connection.on('connected', () => {
            console.log('✅ Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ Mongoose disconnected from MongoDB');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Retrying connection in 5 seconds...');

        // Retry connection after 5 seconds
        setTimeout(() => connectDB(), 5000);
    }
};

module.exports = connectDB;
