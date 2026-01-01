const User = require('../models/User');

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
        res.status(500).json({ message: 'Server error' });
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
        res.status(500).json({ message: 'Server error' });
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
        if (req.user.role !== 'super_admin' && role === 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admins can create other Super Admins' });
        }

        const user = await User.create({
            username,
            email,
            password,
            fullName,
            role,
            phone,
            assignedGrade: assignedGrade || null
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
        res.status(500).json({ message: 'Server error' });
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
        if (req.user.role !== 'super_admin') {
            if (user.role === 'super_admin') {
                return res.status(403).json({ message: 'You cannot modify a Super Admin account' });
            }
            if (role === 'super_admin') {
                return res.status(403).json({ message: 'You cannot promote a user to Super Admin' });
            }
        }

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (fullName) user.fullName = fullName;
        if (role) user.role = role;
        if (phone !== undefined) user.phone = phone;
        if (assignedGrade !== undefined) user.assignedGrade = assignedGrade;
        if (phone !== undefined) user.phone = phone;
        if (assignedGrade !== undefined) user.assignedGrade = assignedGrade;
        if (isActive !== undefined) user.isActive = isActive;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
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

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
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
        res.status(500).json({ message: 'Server error' });
    }
};
