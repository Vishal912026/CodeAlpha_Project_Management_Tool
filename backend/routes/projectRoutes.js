const express = require('express');
const router = express.Router();
const { createProject, getProjects, addMember, getProjectMembers } = require('../controllers/projectController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createProject);
router.get('/', protect, getProjects);

router.post('/:id/members', protect, addMember);
router.get('/:id/members', protect, getProjectMembers);

module.exports = router;