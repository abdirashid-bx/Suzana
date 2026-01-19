const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    getMe,
    updateMe,
    importFromStaff
} = require('../controllers/userController');
const { protect, authorize, canDelete } = require('../middleware/auth');

router.use(protect);

// Publicly accessible to all logged in users
router.get('/profile', getMe);
router.put('/profile', updateMe);

router.use(authorize('admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(canDelete, deleteUser);

router.put('/:id/reset-password', resetPassword);

// Import user from staff
router.post('/import-from-staff', importFromStaff);

module.exports = router;
