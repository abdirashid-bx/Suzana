require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feeRoutes = require('./routes/feeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/schedules', scheduleRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Suzana Education Center API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
// Error handler
app.use((err, req, res, next) => {
    // Log to file
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, 'server_error.log');
    const timestamp = new Date().toISOString();
    const logMessage = `\n[${timestamp}] [GLOBAL ERROR] ${req.method} ${req.originalUrl}\n${err.stack || err.message}\n-------------------`;
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }

    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🏫 Suzana Education Center - School Management System    ║
  ║                                                            ║
  ║   Server running on port ${PORT}                             ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
  ║                                                            ║
  ║   API Endpoints:                                           ║
  ║   • Auth:       /api/auth                                  ║
  ║   • Users:      /api/users                                 ║
  ║   • Students:   /api/students                              ║
  ║   • Staff:      /api/staff                                 ║
  ║   • Grades:     /api/grades                                ║
  ║   • Attendance: /api/attendance                            ║
  ║   • Fees:       /api/fees                                  ║
  ║   • Schedules:  /api/schedules                             ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
