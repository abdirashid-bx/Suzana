const express = require('express');
const router = express.Router();
const {
    getGrades,
    getGrade,
    createGrade,
    updateGrade,
    deleteGrade,
    promoteStudents
} = require('../controllers/gradeController');
const { protect, authorize, canDelete } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getGrades)
    .post(authorize('super_admin', 'admin'), createGrade);

router.route('/:id')
    .get(getGrade)
    .put(authorize('super_admin', 'admin', 'head_teacher'), updateGrade)
    .delete(canDelete, deleteGrade);

router.post('/:id/promote', authorize('super_admin', 'admin'), promoteStudents);

module.exports = router;
