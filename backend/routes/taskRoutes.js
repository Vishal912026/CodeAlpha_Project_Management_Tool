const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTask, deleteTask, addComment } = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createTask);
router.get('/:projectId', protect, getTasksByProject);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/comments', protect, addComment);
module.exports = router;