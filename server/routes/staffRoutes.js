const express = require('express');
const router = express.Router();
const {
    getStaff,
    getStaffMember,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffRoles
} = require('../controllers/staffController');
const { protect, canManageStaff, canDelete } = require('../middleware/auth');

router.use(protect);

router.get('/roles', getStaffRoles);

router.route('/')
    .get(getStaff)
    .post(canManageStaff, createStaff);

router.route('/:id')
    .get(getStaffMember)
    .put(canManageStaff, updateStaff)
    .delete(canDelete, deleteStaff);

module.exports = router;
