const express = require('express');
const router = express.Router();
const {
    getFees,
    getStudentFees,
    createFee,
    payFee,
    deleteFee,
    getFeeSummary,
    getReceipt
} = require('../controllers/feeController');
const { protect, canManageFees, canDelete } = require('../middleware/auth');

router.use(protect);

router.get('/summary', canManageFees, getFeeSummary);
router.get('/student/:studentId', getStudentFees);
router.get('/:id/receipt', getReceipt);

router.route('/')
    .get(getFees)
    .post(canManageFees, createFee);

router.put('/:id/pay', canManageFees, payFee);
router.delete('/:id', canDelete, deleteFee);

module.exports = router;
