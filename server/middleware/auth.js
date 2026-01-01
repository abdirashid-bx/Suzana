const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            if (!req.user.isActive) {
                return res.status(401).json({ message: 'Account is deactivated' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }
        next();
    };
};

// Check if user can delete (only admin)
const canDelete = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Only Admin can delete records'
        });
    }
    next();
};

// Check if user can manage students
const canManageStudents = (req, res, next) => {
    const allowedRoles = ['admin', 'head_teacher'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            message: 'Not authorized to manage students'
        });
    }
    next();
};

// Check if user can manage staff
const canManageStaff = (req, res, next) => {
    const allowedRoles = ['admin'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            message: 'Not authorized to manage staff'
        });
    }
    next();
};

// Check if user can manage fees
const canManageFees = (req, res, next) => {
    const allowedRoles = ['admin', 'head_teacher'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            message: 'Not authorized to manage fees'
        });
    }
    next();
};

// Check if user can edit attendance
const canEditAttendance = (req, res, next) => {
    const allowedRoles = ['admin', 'head_teacher'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            message: 'Only admins and head teachers can edit attendance records'
        });
    }
    next();
};

module.exports = {
    protect,
    authorize,
    canDelete,
    canManageStudents,
    canManageStaff,
    canManageFees,
    canEditAttendance
};
