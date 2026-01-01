const express = require('express');
const router = express.Router();
const {
    getSchedules,
    getScheduleByGrade,
    createSchedule,
    initializeSchedules,
    updateSchedule,
    deleteSchedule,
    getTodaySchedule,
    deleteAllByGrade
} = require('../controllers/scheduleController');
const { protect, authorize, canDelete } = require('../middleware/auth');

router.use(protect);

router.get('/grade/:gradeId', getScheduleByGrade);
router.get('/today/:gradeId', getTodaySchedule);
router.delete('/grade/:gradeId/all', authorize('admin'), deleteAllByGrade);
router.post('/initialize/:gradeId', authorize('admin'), initializeSchedules);

router.route('/')
    .get(getSchedules)
    .post(authorize('admin'), createSchedule);

router.route('/:id')
    .put(authorize('admin'), updateSchedule)
    .delete(canDelete, deleteSchedule);

module.exports = router;
