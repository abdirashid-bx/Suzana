const Fee = require('../models/Fee');
const Student = require('../models/Student');

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private
exports.getFees = async (req, res) => {
    try {
        const { status, student, billingType, year } = req.query;
        let query = {};

        if (status) query.status = status;
        if (student) query.student = student;
        if (billingType) query.billingType = billingType;
        if (year) query.year = parseInt(year);

        const fees = await Fee.find(query)
            .populate({
                path: 'student',
                select: 'fullName admissionNo grade',
                populate: { path: 'grade', select: 'name' }
            })
            .populate('recordedBy', 'fullName')
            .sort({ createdAt: -1 });

        // Calculate totals
        const totals = {
            outstanding: fees.filter(f => f.status === 'outstanding').reduce((sum, f) => sum + f.amount, 0),
            paid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.paidAmount, 0),
            total: fees.reduce((sum, f) => sum + f.amount, 0)
        };

        res.json({ success: true, count: fees.length, fees, totals });
    } catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get student fees
// @route   GET /api/fees/student/:studentId
// @access  Private
exports.getStudentFees = async (req, res) => {
    try {
        const fees = await Fee.find({ student: req.params.studentId })
            .populate('recordedBy', 'fullName')
            .populate('paidRecordedBy', 'fullName')
            .sort({ createdAt: -1 });

        const outstanding = fees.filter(f => f.status === 'outstanding');
        const paid = fees.filter(f => f.status === 'paid');

        const totalOutstanding = outstanding.reduce((sum, f) => sum + f.amount, 0);
        const totalPaid = paid.reduce((sum, f) => sum + f.paidAmount, 0);

        res.json({
            success: true,
            fees,
            summary: {
                outstanding: totalOutstanding,
                paid: totalPaid,
                outstandingCount: outstanding.length,
                paidCount: paid.length
            }
        });
    } catch (error) {
        console.error('Get student fees error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Create fee record
// @route   POST /api/fees
// @access  Private/Admin
exports.createFee = async (req, res) => {
    try {
        const { student, amount, billingType, description, dueDate, term, year } = req.body;

        // Verify student exists
        const studentExists = await Student.findById(student);
        if (!studentExists) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const fee = await Fee.create({
            student,
            amount,
            billingType,
            description,
            dueDate,
            term,
            year: year || new Date().getFullYear(),
            status: 'outstanding',
            recordedBy: req.user.id
        });

        const populatedFee = await Fee.findById(fee._id)
            .populate('student', 'fullName admissionNo')
            .populate('recordedBy', 'fullName');

        res.status(201).json({ success: true, fee: populatedFee });
    } catch (error) {
        console.error('Create fee error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Pay fee (full payment only)
// @route   PUT /api/fees/:id/pay
// @access  Private/Admin
exports.payFee = async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (fee.status === 'paid') {
            return res.status(400).json({ message: 'This fee has already been paid' });
        }

        // Full payment only - no partial payments
        fee.status = 'paid';
        fee.paidAmount = fee.amount;
        fee.paidDate = new Date();
        fee.paymentMethod = paymentMethod || 'cash';
        fee.paidRecordedBy = req.user.id;

        await fee.save();

        const populatedFee = await Fee.findById(fee._id)
            .populate('student', 'fullName admissionNo')
            .populate('recordedBy', 'fullName')
            .populate('paidRecordedBy', 'fullName');

        res.json({
            success: true,
            message: `Payment of ${fee.amount} recorded successfully`,
            fee: populatedFee
        });
    } catch (error) {
        console.error('Pay fee error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private/SuperAdmin
exports.deleteFee = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (fee.status === 'paid') {
            return res.status(400).json({ message: 'Cannot delete paid fee records' });
        }

        await fee.deleteOne();

        res.json({ success: true, message: 'Fee record deleted successfully' });
    } catch (error) {
        console.error('Delete fee error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get fee summary/dashboard
// @route   GET /api/fees/summary
// @access  Private
exports.getFeeSummary = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Overall stats
        const allFees = await Fee.find({ year: currentYear });

        const totalOutstanding = allFees
            .filter(f => f.status === 'outstanding')
            .reduce((sum, f) => sum + f.amount, 0);

        const totalCollected = allFees
            .filter(f => f.status === 'paid')
            .reduce((sum, f) => sum + f.paidAmount, 0);

        const totalExpected = allFees.reduce((sum, f) => sum + f.amount, 0);

        // Students with outstanding fees
        const studentsWithOutstanding = await Fee.find({
            status: 'outstanding',
            year: currentYear
        })
            .populate({
                path: 'student',
                select: 'fullName admissionNo grade',
                populate: { path: 'grade', select: 'name' }
            })
            .sort({ amount: -1 })
            .limit(10);

        // Recent payments
        const recentPayments = await Fee.find({
            status: 'paid',
            paidDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
            .populate('student', 'fullName admissionNo')
            .sort({ paidDate: -1 })
            .limit(10);

        res.json({
            success: true,
            summary: {
                year: currentYear,
                totalExpected,
                totalCollected,
                totalOutstanding,
                collectionRate: totalExpected > 0
                    ? ((totalCollected / totalExpected) * 100).toFixed(1)
                    : 0
            },
            studentsWithOutstanding,
            recentPayments
        });
    } catch (error) {
        console.error('Get fee summary error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Print receipt
// @route   GET /api/fees/:id/receipt
// @access  Private
exports.getReceipt = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id)
            .populate({
                path: 'student',
                select: 'fullName admissionNo grade parent',
                populate: { path: 'grade', select: 'name' }
            })
            .populate('recordedBy', 'fullName')
            .populate('paidRecordedBy', 'fullName');

        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (fee.status !== 'paid') {
            return res.status(400).json({ message: 'Receipt only available for paid fees' });
        }

        res.json({ success: true, receipt: fee });
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};
