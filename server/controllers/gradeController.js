const Grade = require('../models/Grade');
const Classroom = require('../models/Classroom');
const Student = require('../models/Student');

// @desc    Get all grades
// @route   GET /api/grades
// @access  Private
exports.getGrades = async (req, res) => {
    try {
        const grades = await Grade.find({ isActive: true })
            .populate('teacher', 'fullName email')
            .sort({ order: 1 });

        // Get classroom and student counts for each grade
        const gradesWithStats = await Promise.all(grades.map(async (grade) => {
            const classrooms = await Classroom.find({ grade: grade._id, isActive: true });
            const studentCount = await Student.countDocuments({ grade: grade._id, status: 'active' });

            return {
                ...grade.toObject(),
                classroomCount: classrooms.length,
                studentCount,
                classrooms
            };
        }));

        res.json({ success: true, grades: gradesWithStats });
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single grade
// @route   GET /api/grades/:id
// @access  Private
exports.getGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id)
            .populate('teacher', 'fullName email phone');

        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        console.log(`Fetching details for grade: ${grade.name} (${grade._id})`);

        const classrooms = await Classroom.find({ grade: grade._id, isActive: true });
        console.log(`Found ${classrooms.length} classrooms`);

        // Debug: Log the query we are about to make
        console.log('Querying students with grade:', grade._id, 'and status: active');
        const students = await Student.find({ grade: grade._id, status: 'active' })
            .populate('classroom', 'name');

        console.log(`Found ${students.length} students`);

        res.json({
            success: true,
            grade: {
                ...grade.toObject(),
                classrooms,
                students,
                studentCount: students.length
            }
        });
    } catch (error) {
        console.error('Get grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create grade
// @route   POST /api/grades
// @access  Private/Admin
exports.createGrade = async (req, res) => {
    try {
        const { name, description, teacher, maxCapacityPerClass } = req.body;

        // Check if grade exists
        const existingGrade = await Grade.findOne({ name });
        if (existingGrade) {
            return res.status(400).json({ message: 'Grade with this name already exists' });
        }

        // Get next order number
        const lastGrade = await Grade.findOne().sort({ order: -1 });
        const order = lastGrade ? lastGrade.order + 1 : 1;

        const grade = await Grade.create({
            name,
            description,
            order,
            teacher: teacher || null,
            maxCapacityPerClass: maxCapacityPerClass || 29
        });

        // Create initial classroom for this grade
        await Classroom.create({
            grade: grade._id,
            name: `${name}-A`,
            suffix: 'A',
            capacity: grade.maxCapacityPerClass
        });

        const populatedGrade = await Grade.findById(grade._id)
            .populate('teacher', 'fullName');

        res.status(201).json({ success: true, grade: populatedGrade });
    } catch (error) {
        console.error('Create grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update grade
// @route   PUT /api/grades/:id
// @access  Private/Admin
exports.updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        const { name, description, teacher, maxCapacityPerClass, order } = req.body;

        if (name) grade.name = name;
        if (description !== undefined) grade.description = description;
        if (teacher !== undefined) grade.teacher = teacher;
        if (maxCapacityPerClass) grade.maxCapacityPerClass = maxCapacityPerClass;
        if (order) grade.order = order;

        await grade.save();

        const updatedGrade = await Grade.findById(grade._id)
            .populate('teacher', 'fullName');

        res.json({ success: true, grade: updatedGrade });
    } catch (error) {
        console.error('Update grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private/SuperAdmin
exports.deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        // Check if grade has students
        const studentCount = await Student.countDocuments({ grade: grade._id });
        if (studentCount > 0) {
            return res.status(400).json({
                message: `Cannot delete grade with ${studentCount} students. Please transfer students first.`
            });
        }

        // Delete associated classrooms
        await Classroom.deleteMany({ grade: grade._id });

        await grade.deleteOne();

        res.json({ success: true, message: 'Grade deleted successfully' });
    } catch (error) {
        console.error('Delete grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Promote students to next grade
// @route   POST /api/grades/:id/promote
// @access  Private/Admin
exports.promoteStudents = async (req, res) => {
    try {
        const { studentIds, targetGradeId } = req.body;
        const sourceGrade = await Grade.findById(req.params.id);
        const targetGrade = await Grade.findById(targetGradeId);

        if (!sourceGrade || !targetGrade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        let promoted = 0;
        for (const studentId of studentIds) {
            const student = await Student.findById(studentId);
            if (student && student.grade.toString() === sourceGrade._id.toString()) {
                // Decrease old classroom count
                await Classroom.findByIdAndUpdate(student.classroom, {
                    $inc: { currentCount: -1 }
                });

                // Find classroom in target grade
                let newClassroom = await Classroom.findOne({
                    grade: targetGradeId,
                    isActive: true,
                    currentCount: { $lt: targetGrade.maxCapacityPerClass }
                }).sort({ suffix: 1 });

                if (!newClassroom) {
                    const existingClassrooms = await Classroom.countDocuments({ grade: targetGradeId });
                    const suffixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const newSuffix = suffixes[existingClassrooms] || (existingClassrooms + 1).toString();

                    newClassroom = await Classroom.create({
                        grade: targetGradeId,
                        name: `${targetGrade.name}-${newSuffix}`,
                        suffix: newSuffix,
                        capacity: targetGrade.maxCapacityPerClass,
                        currentCount: 0
                    });
                }

                student.grade = targetGradeId;
                student.classroom = newClassroom._id;
                await student.save();

                newClassroom.currentCount += 1;
                await newClassroom.save();

                promoted++;
            }
        }

        res.json({
            success: true,
            message: `Successfully promoted ${promoted} students to ${targetGrade.name}`
        });
    } catch (error) {
        console.error('Promote students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
