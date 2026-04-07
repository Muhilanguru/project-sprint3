const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus, summarizeTask, summarizeText } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Summarize text (no task ID needed - for creation preview)
router.post('/summarize-text', protect, summarizeText);

router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('admin'), createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, authorize('admin'), updateTask)
  .delete(protect, authorize('admin'), deleteTask);

router.patch('/:id/status', protect, updateTaskStatus);

// Summarize existing task
router.post('/:id/summarize', protect, summarizeTask);

module.exports = router;

