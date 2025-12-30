const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student is required']
    },
    receiptNo: {
        type: String,
        unique: true,
        sparse: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    billingType: {
        type: String,
        enum: ['term', 'monthly', 'annual', 'once'],
        required: [true, 'Billing type is required']
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['outstanding', 'paid'],
        default: 'outstanding'
    },
    dueDate: {
        type: Date
    },
    paidDate: {
        type: Date,
        default: null
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'mobile_money', 'cheque'],
        default: null
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paidRecordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    term: {
        type: String,
        trim: true
    },
    year: {
        type: Number,
        default: () => new Date().getFullYear()
    }
}, {
    timestamps: true
});

// Generate receipt number before saving
feeSchema.pre('save', async function (next) {
    if (this.status === 'paid' && !this.receiptNo) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Fee').countDocuments({
            receiptNo: { $regex: `^SEC-${year}` }
        });
        this.receiptNo = `SEC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Virtual for outstanding balance
feeSchema.virtual('balance').get(function () {
    return this.amount - this.paidAmount;
});

feeSchema.set('toJSON', { virtuals: true });
feeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Fee', feeSchema);
