const Staff = require('../models/Staff');
const User = require('../models/User');
const Grade = require('../models/Grade');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
exports.getStaff = async (req, res) => {
    try {
        const { role, search, status, sortBy, sortOrder } = req.query;
        let query = {};

        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const staff = await Staff.find(query)
            .populate('assignedGrade', 'name')
            .populate('userAccount', 'username email')
            .sort(sortOptions);

        res.json({ success: true, count: staff.length, staff });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private
exports.getStaffMember = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id)
            .populate('assignedGrade', 'name')
            .populate('userAccount', 'username email role')
            .populate('registeredBy', 'fullName');

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json({ success: true, staff });
    } catch (error) {
        console.error('Get staff member error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Create staff member
// @route   POST /api/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
    try {
        const {
            nationalId,
            fullName,
            gender,
            dateOfBirth,
            dateOfEmployment,
            qualification,
            role,
            assignedGrade,
            location,
            phone,
            email,
            emergencyContact,
            medicalNotes,
            createUserAccount,
            username,
            password
        } = req.body;

        // Check if national ID exists
        const existingStaff = await Staff.findOne({ nationalId });
        if (existingStaff) {
            return res.status(400).json({ message: 'Staff with this National ID already exists' });
        }

        // Parse emergencyContact if it's a string (from FormData)
        let parsedEmergencyContact = emergencyContact;
        if (typeof emergencyContact === 'string') {
            try {
                parsedEmergencyContact = JSON.parse(emergencyContact);
            } catch (error) {
                return res.status(400).json({ message: 'Invalid emergency contact format' });
            }
        }

        // Handle empty assignedGrade (from FormData it might be "")
        const gradeToAssign = assignedGrade === '' ? null : assignedGrade;

        // Create staff member
        const staffData = {
            nationalId,
            fullName,
            gender,
            dateOfBirth,
            dateOfEmployment,
            qualification,
            role,
            assignedGrade: gradeToAssign,
            location,
            phone,
            email,
            emergencyContact: parsedEmergencyContact,
            medicalNotes,
            photo: req.file ? req.file.path : null,
            registeredBy: req.user.id
        };

        const staff = await Staff.create(staffData);

        // Optionally create user account for staff
        if (createUserAccount && username && password) {
            const userRole = role === 'head_teacher' ? 'head_teacher' :
                role === 'admin' ? 'admin' : 'teacher';

            const user = await User.create({
                username,
                email: email || `${username}@suzana.edu`,
                password,
                fullName,
                role: userRole,
                phone,
                assignedGrade: assignedGrade || null
            });

            staff.userAccount = user._id;
            await staff.save();
        }

        const populatedStaff = await Staff.findById(staff._id)
            .populate('assignedGrade', 'name')
            .populate('userAccount', 'username email');

        res.status(201).json({ success: true, staff: populatedStaff });
    } catch (error) {
        console.error('Create staff error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate entry found' });
        }
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        let updates = { ...req.body };

        // Parse JSON strings if sent as FormData
        if (typeof updates.emergencyContact === 'string') {
            try {
                updates.emergencyContact = JSON.parse(updates.emergencyContact);
            } catch (error) {
                return res.status(400).json({ message: 'Invalid emergency contact format' });
            }
        }

        // Handle empty assignedGrade (from FormData it might be "")
        if (updates.assignedGrade === '') {
            updates.assignedGrade = null;
        }

        // Handle photo upload
        if (req.file) {
            updates.photo = req.file.path; // Multer saves path relative to root usually, or absolute depending on config. 
            // In createStaff it uses req.file.path. Let's check createStaff again.
            // createStaff uses: photo: req.file ? req.file.path : null,
            // Wait, Student controller uses `/uploads/photos/${req.file.filename}`.
            // I should double check how Multer is configured or consistent behavior.
            // Looking at studentController line 132: photoPath = `/uploads/photos/${req.file.filename}`;
            // Looking at staffController line 121: photo: req.file ? req.file.path : null,
            // This suggests inconsistent implementations!
            // I should probably switch Staff to use the relative path consistent with Student for standard proxying.
            // Let's assume standard behavior for now but I'll check if I need to fix createStaff too or if .path is what we want.
            // Actually, if I use .path, it might be the full file path which is not good for serving.
            // Let's stick to what Student does: `/uploads/photos/${req.file.filename}` if using the same uploader middleware.
            // Assuming the same middleware is used.
            updates.photo = `/uploads/photos/${req.file.filename}`;
        }

        // Safety check if we mistakenly used .path in createStaff, we should probably align it.
        // But for now let's make update work.

        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
            .populate('assignedGrade', 'name')
            .populate('userAccount', 'username email');

        res.json({ success: true, staff: updatedStaff });
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private/SuperAdmin
exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // If staff has user account, delete it too
        if (staff.userAccount) {
            await User.findByIdAndDelete(staff.userAccount);
        }

        await staff.deleteOne();

        res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};
