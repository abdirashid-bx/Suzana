const User = require('../models/User');
const Staff = require('../models/Staff');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+visiblePassword');
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateMe = async (req, res) => {
    try {
        const { username, email, fullName, phone, password } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check uniqueness if changing username/email
        if (username && username !== user.username) {
            const exists = await User.findOne({ username });
            if (exists) return res.status(400).json({ message: 'Username already taken' });
            user.username = username;
        }

        if (email && email !== user.email) {
            const exists = await User.findOne({ email });
            if (exists) return res.status(400).json({ message: 'Email already taken' });
            user.email = email;
        }

        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (password) user.password = password;

        await user.save();

        res.json({ success: true, user });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const { role, search, isActive } = req.query;
        let query = {};

        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOptions = {};
        if (req.query.sortBy) {
            sortOptions[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const users = await User.find(query)
            .populate('assignedGrade', 'name')
            .select('+visiblePassword')
            .sort(sortOptions);

        res.json({ success: true, count: users.length, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('assignedGrade')
            .select('+visiblePassword');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, fullName, role, phone, assignedGrade } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // RBAC: Check if creator is allowed to assign the requested role
        // Only admins can create other admins
        if (req.user.role !== 'admin' && role === 'admin') {
            return res.status(403).json({ message: 'Only Admins can create other Admins' });
        }

        const user = await User.create({
            username,
            email,
            password,
            fullName,
            role,
            phone,
            assignedGrade: assignedGrade && assignedGrade.trim() !== '' ? assignedGrade : null
        });

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const { username, email, password, fullName, role, phone, assignedGrade, isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // RBAC: Check if updater is allowed to edit this user
        if (req.user.role !== 'admin') {
            if (user.role === 'admin') {
                return res.status(403).json({ message: 'You cannot modify an Admin account' });
            }
            if (role === 'admin') {
                return res.status(403).json({ message: 'You cannot promote a user to Admin' });
            }
        }

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (fullName) user.fullName = fullName;
        if (role) user.role = role;
        if (phone !== undefined) user.phone = phone;
        if (assignedGrade !== undefined) {
            user.assignedGrade = assignedGrade && assignedGrade.trim() !== '' ? assignedGrade : null;
        }
        if (isActive !== undefined) user.isActive = isActive;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();

        // Cleanup: Unlink from any staff member to allow re-import
        await Staff.updateMany(
            { userAccount: user._id },
            { userAccount: null }
        );

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

// @desc    Import user from staff
// @route   POST /api/users/import-from-staff
// @access  Private/Admin
exports.importFromStaff = async (req, res) => {
    try {
        const { staffId, username, password, confirmPassword } = req.body;

        // Validate input
        if (!staffId || !username || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Find the staff member
        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // Check if staff already has a user account
        if (staff.userAccount) {
            return res.status(400).json({
                message: 'This staff member already has a system user account'
            });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Map staff role to user role
        const roleMapping = {
            'admin': 'admin',
            'head_teacher': 'head_teacher',
            'teacher': 'teacher'
        };

        const userRole = roleMapping[staff.role];

        if (!userRole) {
            return res.status(400).json({
                message: 'This staff role cannot be imported as a system user. Only Teachers, Head Teachers, and Admins are allowed.'
            });
        }

        // Create user account
        const user = await User.create({
            username,
            email: staff.email || `${username}@suzana.edu`,
            password,
            fullName: staff.fullName,
            role: userRole,
            phone: staff.phone,
            assignedGrade: staff.assignedGrade || null
        });

        // Link user account to staff
        staff.userAccount = user._id;
        await staff.save();

        res.status(201).json({
            success: true,
            message: 'User successfully imported from staff',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Import from staff error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
};

