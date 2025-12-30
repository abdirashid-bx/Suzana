const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    suffix: {
        type: String,
        default: 'A' // A, B, C, etc.
    },
    capacity: {
        type: Number,
        default: 29
    },
    currentCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual to check if classroom is full
classroomSchema.virtual('isFull').get(function () {
    return this.currentCount >= this.capacity;
});

// Virtual to get available spots
classroomSchema.virtual('availableSpots').get(function () {
    return this.capacity - this.currentCount;
});

classroomSchema.set('toJSON', { virtuals: true });
classroomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Classroom', classroomSchema);
