const mongoose = require('mongoose');
const Task = require('../models/Task');
const { getProjectIfMember } = require('../utils/projectAccess');


const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];

const handleError = (res, err) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: err.message });
};


const getTaskIfMember = async (taskId, userId) => {
  if (!mongoose.isObjectIdOrHexString(taskId)) return null;
  const task = await Task.findById(taskId);
  if (!task) return null;
  const project = await getProjectIfMember(task.project, userId);
  return project ? task : null;
};

const isEmpty = (value) => value === undefined || value === null || value === '';

exports.createTask = async (req, res) => {
  try {
    const { status, priority, dueDate } = req.body;
    const title = String(req.body.title ?? '').trim();
    const description = req.body.description === undefined ? undefined : String(req.body.description);

    if (!title) return res.status(400).json({ message: 'Task title is required' });

    const project = await getProjectIfMember(req.body.project, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let assignedTo;
    if (!isEmpty(req.body.assignedTo)) {
      const candidate = req.body.assignedTo;
      if (!mongoose.isObjectIdOrHexString(candidate) || !project.members.some((m) => m.equals(candidate))) {
        return res.status(400).json({ message: 'Assigned user must be a member of this project' });
      }
      assignedTo = candidate;
    }

    const task = await Task.create({
      title, description, status, priority, dueDate, assignedTo,
      project: project._id,
    });
    res.status(201).json(task);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getTasksByProject = async (req, res) => {
  try {
    const project = await getProjectIfMember(req.params.projectId, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
       const tasks = await Task.find({ project: project._id })
      .populate('comments.postedBy', 'name')
      .populate('assignedTo', 'name');

    res.json(tasks);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await getTaskIfMember(req.params.id, req.user);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] === undefined) continue;

      if (field === 'assignedTo') {
        if (isEmpty(req.body.assignedTo)) {
          task.assignedTo = undefined;
          continue;
        }
        const project = await getProjectIfMember(task.project, req.user);
        const candidate = req.body.assignedTo;
        if (!mongoose.isObjectIdOrHexString(candidate) || !project.members.some((m) => m.equals(candidate))) {
          return res.status(400).json({ message: 'Assigned user must be a member of this project' });
        }
        task.assignedTo = candidate;
      } else if (field === 'title') {
        task.title = String(req.body.title ?? '').trim();
      } else {
        task[field] = req.body[field];
      }
    }

    await task.save(); 
    res.json(task);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await getTaskIfMember(req.params.id, req.user);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    handleError(res, err);
  }
};

exports.addComment = async (req, res) => {
  try {
    const task = await getTaskIfMember(req.params.id, req.user);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const text = String(req.body.text ?? '').trim();
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });

    task.comments.push({ text, postedBy: req.user });
    await task.save();
    const updated = await Task.findById(task._id).populate('comments.postedBy', 'name');
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};