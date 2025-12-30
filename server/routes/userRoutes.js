const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    resetPassword
} = require('../controllers/userController');
const { protect, authorize, canDelete } = require('../middleware/auth');

router.use(protect);
router.use(authorize('super_admin', 'admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(canDelete, deleteUser);

router.put('/:id/reset-password', resetPassword);

module.exports = router;
