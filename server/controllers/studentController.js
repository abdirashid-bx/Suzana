const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Grade = require('../models/Grade');
const Fee = require('../models/Fee');

// Helper: Find or create classroom with available space
const findOrCreateClassroom = async (gradeId) => {
    const grade = await Grade.findById(gradeId);
    if (!grade) throw new Error('Grade not found');

    // Find classroom with available space
    let classroom = await Classroom.findOne({
        grade: gradeId,
        isActive: true,
        currentCount: { $lt: grade.maxCapacityPerClass }
    }).sort({ suffix: 1 });

    // If no available classroom, create a new one
    if (!classroom) {
        const existingClassrooms = await Classroom.countDocuments({ grade: gradeId });
        const suffixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const newSuffix = suffixes[existingClassrooms] || (existingClassrooms + 1).toString();

        classroom = await Classroom.create({
            grade: gradeId,
            name: `${grade.name}-${newSuffix}`,
            suffix: newSuffix,
            capacity: grade.maxCapacityPerClass,
            currentCount: 0
        });
    }

    return classroom;
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
    try {
        const { grade, search, status, sortBy, sortOrder } = req.query;
        let query = {};

        if (grade) query.grade = grade;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { admissionNo: { $regex: search, $options: 'i' } },
                { 'parent.fullName': { $regex: search, $options: 'i' } }
            ];
        }

        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const students = await Student.find(query)
            .populate('grade', 'name order')
            .populate('classroom', 'name suffix')
            .sort(sortOptions);

        res.json({ success: true, count: students.length, students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('grade', 'name order')
            .populate('classroom', 'name suffix')
            .populate('registeredBy', 'fullName');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get fee records
        const fees = await Fee.find({ student: student._id }).sort({ createdAt: -1 });

        res.json({ success: true, student, fees });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private/Admin
exports.createStudent = async (req, res) => {
    try {
        let {
            admissionNo,
            fullName,
            gender,
            dateOfBirth,
            grade,
            parent,
            initialFee
        } = req.body;

        // Parse JSON strings if sent as FormData
        if (typeof parent === 'string') {
            parent = JSON.parse(parent);
        }
        if (typeof initialFee === 'string') {
            initialFee = JSON.parse(initialFee);
        }

        // Check if admission number exists
        const existingStudent = await Student.findOne({ admissionNo });
        if (existingStudent) {
            return res.status(400).json({ message: 'Admission number already exists' });
        }

        // Find or create classroom
        const classroom = await findOrCreateClassroom(grade);

        // Handle photo upload
        let photoPath = null;
        if (req.file) {
            photoPath = `/uploads/photos/${req.file.filename}`;
        }

        // Create student
        const student = await Student.create({
            admissionNo,
            fullName,
            gender,
            dateOfBirth,
            grade,
            classroom: classroom._id,
            parent,
            initialFee,
            photo: photoPath,
            registeredBy: req.user.id
        });

        // Update classroom count
        classroom.currentCount += 1;
        await classroom.save();

        // Create initial fee record as outstanding
        await Fee.create({
            student: student._id,
            amount: initialFee.amount,
            billingType: initialFee.billingType || 'once',
            description: 'Registration fee',
            status: 'outstanding',
            recordedBy: req.user.id
        });

        const populatedStudent = await Student.findById(student._id)
            .populate('grade', 'name')
            .populate('classroom', 'name');

        res.status(201).json({ success: true, student: populatedStudent });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let updates = { ...req.body };

        // Parse JSON strings if sent as FormData
        if (typeof updates.parent === 'string') {
            updates.parent = JSON.parse(updates.parent);
        }

        // Handle photo upload
        if (req.file) {
            updates.photo = `/uploads/photos/${req.file.filename}`;
        }

        // If grade is changing, handle classroom transfer
        if (updates.grade && updates.grade !== student.grade.toString()) {
            // Decrease old classroom count
            await Classroom.findByIdAndUpdate(student.classroom, {
                $inc: { currentCount: -1 }
            });

            // Find new classroom
            const newClassroom = await findOrCreateClassroom(updates.grade);
            updates.classroom = newClassroom._id;
            newClassroom.currentCount += 1;
            await newClassroom.save();
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
            .populate('grade', 'name')
            .populate('classroom', 'name');

        res.json({ success: true, student: updatedStudent });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/SuperAdmin
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Decrease classroom count
        await Classroom.findByIdAndUpdate(student.classroom, {
            $inc: { currentCount: -1 }
        });

        // Delete associated fees
        await Fee.deleteMany({ student: student._id });

        await student.deleteOne();

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get students by classroom
// @route   GET /api/students/classroom/:classroomId
// @access  Private
exports.getStudentsByClassroom = async (req, res) => {
    try {
        const students = await Student.find({
            classroom: req.params.classroomId,
            status: 'active'
        })
            .populate('grade', 'name')
            .sort({ fullName: 1 });

        res.json({ success: true, count: students.length, students });
    } catch (error) {
        console.error('Get students by classroom error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Generate next admission number
// @route   GET /api/students/next-admission-no
// @access  Private
exports.getNextAdmissionNo = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const lastStudent = await Student.findOne({
            admissionNo: { $regex: `^SEC/${year}/` }
        }).sort({ admissionNo: -1 });

        let nextNo = 1;
        if (lastStudent) {
            const parts = lastStudent.admissionNo.split('/');
            nextNo = parseInt(parts[2]) + 1;
        }

        const admissionNo = `SEC/${year}/${String(nextNo).padStart(4, '0')}`;
        res.json({ success: true, admissionNo });
    } catch (error) {
        console.error('Get next admission no error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
