const express = require('express');
const router = express.Router();
const { getOverview, getUserPerformance } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/overview', protect, authorize('admin'), getOverview);
router.get('/user-performance', protect, authorize('admin'), getUserPerformance);

module.exports = router;
