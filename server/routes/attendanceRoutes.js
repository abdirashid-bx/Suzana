const express = require('express');
const router = express.Router();
const {
    getAttendance,
    getAttendanceForMarking,
    markAttendance,
    updateAttendance,
    getStudentAttendance,
    getAttendanceSummary
} = require('../controllers/attendanceController');
const { protect, canEditAttendance } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getAttendanceSummary);
router.get('/mark/:classroomId', getAttendanceForMarking);
router.get('/student/:studentId', getStudentAttendance);

router.route('/')
    .get(getAttendance)
    .post(markAttendance);

router.route('/:id')
    .put(canEditAttendance, updateAttendance);

module.exports = router;
