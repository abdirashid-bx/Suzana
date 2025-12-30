const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        required: true
    }
});

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required']
    },
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    records: [attendanceRecordSchema],
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastEditedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for unique attendance per classroom per day
attendanceSchema.index({ date: 1, classroom: 1 }, { unique: true });

// Virtual for statistics
attendanceSchema.virtual('stats').get(function () {
    const present = this.records.filter(r => r.status === 'present').length;
    const absent = this.records.filter(r => r.status === 'absent').length;
    const late = this.records.filter(r => r.status === 'late').length;
    return { present, absent, late, total: this.records.length };
});

attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
