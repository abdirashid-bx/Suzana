const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Grade name is required'],
        unique: true,
        trim: true
    },
    order: {
        type: Number,
        required: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    maxCapacityPerClass: {
        type: Number,
        default: 29 // 24 + 5
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Grade', gradeSchema);
