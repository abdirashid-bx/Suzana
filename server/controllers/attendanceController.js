const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
    try {
        const { date, grade, classroom } = req.query;
        let query = {};

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }
        if (grade) query.grade = grade;
        if (classroom) query.classroom = classroom;

        const attendance = await Attendance.find(query)
            .populate('grade', 'name')
            .populate('classroom', 'name')
            .populate('markedBy', 'fullName')
            .populate('records.student', 'fullName admissionNo')
            .sort({ date: -1 });

        res.json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get attendance for marking (students in a classroom)
// @route   GET /api/attendance/mark/:classroomId
// @access  Private
exports.getAttendanceForMarking = async (req, res) => {
    try {
        const { date } = req.query;
        const classroom = await Classroom.findById(req.params.classroomId)
            .populate('grade', 'name');

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Get students in this classroom
        const students = await Student.find({
            classroom: classroom._id,
            status: 'active'
        }).sort({ fullName: 1 });

        // Check if attendance already exists for this date
        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            classroom: classroom._id,
            date: { $gte: attendanceDate, $lte: endOfDay }
        }).populate('records.student', 'fullName admissionNo');

        res.json({
            success: true,
            classroom,
            students,
            existingAttendance,
            date: attendanceDate
        });
    } catch (error) {
        console.error('Get attendance for marking error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private
exports.markAttendance = async (req, res) => {
    try {
        const { date, grade, classroom, records } = req.body;

        // Check if attendance already exists
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        let attendance = await Attendance.findOne({
            classroom,
            date: { $gte: attendanceDate, $lte: endOfDay }
        });

        if (attendance) {
            // Update existing attendance
            attendance.records = records;
            attendance.lastEditedBy = req.user.id;
            attendance.lastEditedAt = new Date();
            await attendance.save();
        } else {
            // Create new attendance
            attendance = await Attendance.create({
                date: attendanceDate,
                grade,
                classroom,
                records,
                markedBy: req.user.id
            });
        }

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('grade', 'name')
            .populate('classroom', 'name')
            .populate('markedBy', 'fullName')
            .populate('records.student', 'fullName admissionNo');

        res.json({ success: true, attendance: populatedAttendance });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Update attendance (for authorized roles)
// @route   PUT /api/attendance/:id
// @access  Private/Admin/HeadTeacher
exports.updateAttendance = async (req, res) => {
    try {
        const { records } = req.body;

        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        attendance.records = records;
        attendance.lastEditedBy = req.user.id;
        attendance.lastEditedAt = new Date();
        await attendance.save();

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('grade', 'name')
            .populate('classroom', 'name')
            .populate('markedBy', 'fullName')
            .populate('lastEditedBy', 'fullName')
            .populate('records.student', 'fullName admissionNo');

        res.json({ success: true, attendance: populatedAttendance });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get student attendance history
// @route   GET /api/attendance/student/:studentId
// @access  Private
exports.getStudentAttendance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateQuery = {};

        if (startDate && endDate) {
            dateQuery = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const attendance = await Attendance.find({
            'records.student': req.params.studentId,
            ...dateQuery
        })
            .populate('grade', 'name')
            .sort({ date: -1 });

        // Extract only this student's records
        const studentRecords = attendance.map(att => {
            const record = att.records.find(r => r.student.toString() === req.params.studentId);
            return {
                date: att.date,
                grade: att.grade,
                status: record ? record.status : null
            };
        });

        // Calculate statistics
        const stats = {
            total: studentRecords.length,
            present: studentRecords.filter(r => r.status === 'present').length,
            absent: studentRecords.filter(r => r.status === 'absent').length,
            late: studentRecords.filter(r => r.status === 'late').length
        };
        stats.attendanceRate = stats.total > 0
            ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
            : 0;

        res.json({ success: true, records: studentRecords, stats });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get attendance summary by date
// @route   GET /api/attendance/summary
// @access  Private
exports.getAttendanceSummary = async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await Attendance.find({
            date: { $gte: queryDate, $lte: endOfDay }
        }).populate('grade', 'name').populate('classroom', 'name');

        const summary = attendance.map(att => ({
            grade: att.grade,
            classroom: att.classroom,
            stats: att.stats
        }));

        // Calculate overall stats
        const overall = {
            present: 0,
            absent: 0,
            late: 0,
            total: 0
        };

        attendance.forEach(att => {
            const stats = att.stats;
            overall.present += stats.present;
            overall.absent += stats.absent;
            overall.late += stats.late;
            overall.total += stats.total;
        });

        res.json({ success: true, date: queryDate, summary, overall });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};
