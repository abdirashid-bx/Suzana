const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    // Personal Details
    photo: {
        type: String,
        default: null
    },
    nationalId: {
        type: String,
        required: [true, 'National ID is required'],
        unique: true,
        trim: true
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

    // Employment Details
    dateOfEmployment: {
        type: Date,
        required: [true, 'Date of employment is required'],
        default: Date.now
    },
    qualification: {
        type: String,
        enum: ['certificate', 'diploma', 'bachelors', 'masters', 'phd'],
        required: [true, 'Qualification is required']
    },
    role: {
        type: String,
        enum: ['teacher', 'head_teacher', 'admin', 'support_staff'],
        required: [true, 'Role is required']
    },
    assignedGrade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        default: null
    },

    // Contact Details
    location: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },

    // Emergency Contact
    emergencyContact: {
        fullName: {
            type: String,
            required: [true, 'Emergency contact name is required'],
            trim: true
        },
        relationship: {
            type: String,
            required: [true, 'Relationship is required'],
            trim: true
        },
        location: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Emergency contact phone is required'],
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

    // Medical Notes
    medicalNotes: {
        type: String,
        trim: true
    },

    // User account link (if applicable)
    userAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Administrative
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_leave', 'terminated'],
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
staffSchema.virtual('age').get(function () {
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

staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Staff', staffSchema);
