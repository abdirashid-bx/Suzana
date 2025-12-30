const express = require('express');
const router = express.Router();
const {
    getSchedules,
    getScheduleByGrade,
    createSchedule,
    initializeSchedules,
    updateSchedule,
    deleteSchedule,
    getTodaySchedule
} = require('../controllers/scheduleController');
const { protect, authorize, canDelete } = require('../middleware/auth');

router.use(protect);

router.get('/grade/:gradeId', getScheduleByGrade);
router.get('/today/:gradeId', getTodaySchedule);
router.post('/initialize/:gradeId', authorize('super_admin', 'admin'), initializeSchedules);

router.route('/')
    .get(getSchedules)
    .post(authorize('super_admin', 'admin'), createSchedule);

router.route('/:id')
    .put(authorize('super_admin', 'admin'), updateSchedule)
    .delete(canDelete, deleteSchedule);

module.exports = router;
