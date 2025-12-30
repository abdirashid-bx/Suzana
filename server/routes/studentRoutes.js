const express = require('express');
const router = express.Router();
const {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentsByClassroom,
    getNextAdmissionNo
} = require('../controllers/studentController');
const { protect, canManageStudents, canDelete } = require('../middleware/auth');
const { handlePhotoUpload } = require('../middleware/upload');

router.use(protect);

router.get('/next-admission-no', getNextAdmissionNo);
router.get('/classroom/:classroomId', getStudentsByClassroom);

router.route('/')
    .get(getStudents)
    .post(canManageStudents, handlePhotoUpload, createStudent);

router.route('/:id')
    .get(getStudent)
    .put(canManageStudents, handlePhotoUpload, updateStudent)
    .delete(canDelete, deleteStudent);

module.exports = router;

