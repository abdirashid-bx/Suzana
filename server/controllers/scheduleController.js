const Schedule = require('../models/Schedule');
const Grade = require('../models/Grade');

// Default daily schedule template
const defaultScheduleTemplate = [
    { startTime: '08:00', endTime: '09:00', activity: 'Morning Activity', type: 'activity' },
    { startTime: '09:00', endTime: '09:30', activity: 'Class 1', type: 'class' },
    { startTime: '09:30', endTime: '09:40', activity: 'Short Break', type: 'break' },
    { startTime: '09:40', endTime: '10:10', activity: 'Class 2', type: 'class' },
    { startTime: '10:10', endTime: '10:20', activity: 'Short Break', type: 'break' },
    { startTime: '10:20', endTime: '10:50', activity: 'Class 3', type: 'class' },
    { startTime: '10:50', endTime: '11:00', activity: 'Short Break', type: 'break' },
    { startTime: '11:00', endTime: '11:30', activity: 'Class 4', type: 'class' },
    { startTime: '11:30', endTime: '11:40', activity: 'Short Break', type: 'break' },
    { startTime: '11:40', endTime: '12:10', activity: 'Class 5', type: 'class' },
    { startTime: '12:10', endTime: '12:30', activity: 'Preparation for Lunch', type: 'activity' },
    { startTime: '12:30', endTime: '14:30', activity: 'Lunch & Nap', type: 'lunch' },
    { startTime: '14:30', endTime: '15:00', activity: 'Class 6', type: 'class' },
    { startTime: '15:00', endTime: '15:30', activity: 'Class 7', type: 'class' },
    { startTime: '15:30', endTime: '15:30', activity: 'Home Time', type: 'activity' }
];

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private
exports.getSchedules = async (req, res) => {
    try {
        const { grade, dayOfWeek } = req.query;
        let query = { isActive: true };

        if (grade) query.grade = grade;
        if (dayOfWeek) query.dayOfWeek = dayOfWeek;

        const schedules = await Schedule.find(query)
            .populate('grade', 'name order')
            .populate('createdBy', 'fullName')
            .sort({ 'grade.order': 1, dayOfWeek: 1 });

        res.json({ success: true, count: schedules.length, schedules });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get schedule by grade
// @route   GET /api/schedules/grade/:gradeId
// @access  Private
exports.getScheduleByGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.gradeId);
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        const schedules = await Schedule.find({
            grade: req.params.gradeId,
            isActive: true
        }).sort({ dayOfWeek: 1 });

        // Create a map for easy access
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const weekSchedule = {};

        days.forEach(day => {
            const schedule = schedules.find(s => s.dayOfWeek === day);
            weekSchedule[day] = schedule || null;
        });

        res.json({ success: true, grade, weekSchedule });
    } catch (error) {
        console.error('Get schedule by grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create or update schedule
// @route   POST /api/schedules
// @access  Private/Admin
exports.createSchedule = async (req, res) => {
    try {
        const { grade, dayOfWeek, periods } = req.body;

        // Check if schedule exists
        let schedule = await Schedule.findOne({ grade, dayOfWeek });

        if (schedule) {
            // Update existing
            schedule.periods = periods || defaultScheduleTemplate;
            await schedule.save();
        } else {
            // Create new
            schedule = await Schedule.create({
                grade,
                dayOfWeek,
                periods: periods || defaultScheduleTemplate,
                createdBy: req.user.id
            });
        }

        const populatedSchedule = await Schedule.findById(schedule._id)
            .populate('grade', 'name');

        res.status(201).json({ success: true, schedule: populatedSchedule });
    } catch (error) {
        console.error('Create schedule error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Schedule for this grade and day already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Initialize default schedules for a grade
// @route   POST /api/schedules/initialize/:gradeId
// @access  Private/Admin
exports.initializeSchedules = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.gradeId);
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const createdSchedules = [];

        for (const day of days) {
            // Check if schedule already exists
            const existing = await Schedule.findOne({ grade: grade._id, dayOfWeek: day });

            if (!existing) {
                const schedule = await Schedule.create({
                    grade: grade._id,
                    dayOfWeek: day,
                    periods: defaultScheduleTemplate,
                    createdBy: req.user.id
                });
                createdSchedules.push(schedule);
            }
        }

        res.json({
            success: true,
            message: `Created ${createdSchedules.length} schedule(s) for ${grade.name}`,
            schedules: createdSchedules
        });
    } catch (error) {
        console.error('Initialize schedules error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private/Admin
exports.updateSchedule = async (req, res) => {
    try {
        const { periods } = req.body;

        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        schedule.periods = periods;
        await schedule.save();

        const populatedSchedule = await Schedule.findById(schedule._id)
            .populate('grade', 'name');

        res.json({ success: true, schedule: populatedSchedule });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private/SuperAdmin
exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        await schedule.deleteOne();

        res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get today's schedule for a grade
// @route   GET /api/schedules/today/:gradeId
// @access  Private
exports.getTodaySchedule = async (req, res) => {
    try {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];

        if (today === 'saturday' || today === 'sunday') {
            return res.json({
                success: true,
                message: 'No classes on weekends',
                schedule: null
            });
        }

        const schedule = await Schedule.findOne({
            grade: req.params.gradeId,
            dayOfWeek: today,
            isActive: true
        }).populate('grade', 'name');

        res.json({ success: true, day: today, schedule });
    } catch (error) {
        console.error('Get today schedule error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
