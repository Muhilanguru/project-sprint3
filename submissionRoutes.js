const express = require('express');
const router = express.Router();
const { createSubmission, getSubmissions, reviewSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getSubmissions)
  .post(protect, authorize('user'), createSubmission);

router.patch('/:id/review', protect, authorize('admin'), reviewSubmission);

module.exports = router;
