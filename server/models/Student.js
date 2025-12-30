const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // Personal Details
    admissionNo: {
        type: String,
        required: [true, 'Admission number is required'],
        unique: true,
        trim: true
    },
    photo: {
        type: String,
        default: null
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Gender is required']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
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

    // Parent/Guardian Details
    parent: {
        fullName: {
            type: String,
            required: [true, 'Parent/Guardian name is required'],
            trim: true
        },
        relationship: {
            type: String,
            required: [true, 'Relationship is required'],
            enum: ['father', 'mother', 'guardian', 'other']
        },
        location: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        alternativeContact: {
            type: String,
            trim: true
        },
        signatureDate: {
            type: Date,
            default: Date.now
        }
    },

    // Fee Details (initial registration fee)
    initialFee: {
        amount: {
            type: Number,
            required: [true, 'Fee amount is required'],
            min: 0
        },
        billingType: {
            type: String,
            enum: ['term', 'monthly', 'annual', 'once'],
            required: true
        }
    },

    // Administrative
    admissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'graduated', 'transferred'],
        default: 'active'
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Virtual for age calculation
studentSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
