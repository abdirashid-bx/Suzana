const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    activity: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['activity', 'class', 'break', 'lunch', 'nap'],
        required: true
    }
});

const scheduleSchema = new mongoose.Schema({
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required']
    },
    dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        required: true
    },
    periods: [periodSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for unique schedule per grade per day
scheduleSchema.index({ grade: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
