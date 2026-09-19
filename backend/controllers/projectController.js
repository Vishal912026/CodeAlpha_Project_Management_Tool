const Project = require('../models/Project');
const User = require('../models/User');
const { getProjectIfMember } = require('../utils/projectAccess');

exports.createProject = async (req, res) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const description = req.body.description === undefined ? undefined : String(req.body.description).trim();

    if (!name) return res.status(400).json({ message: 'Project name is required' });
    if (name.length > 100) return res.status(400).json({ message: 'Project name is too long (max 100 characters)' });

    const project = await Project.create({
      name,
      description,
      owner: req.user,
      members: [req.user],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const project = await getProjectIfMember(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.owner.equals(req.user)) {
      return res.status(403).json({ message: 'Only the project owner can add members' });
    }

    const email = String(req.body.email ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = await Project.findByIdAndUpdate(
      project._id,
      { $addToSet: { members: user._id } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectMembers = async (req, res) => {
  try {
    const project = await getProjectIfMember(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await User.find({ _id: { $in: project.members } }, 'name email');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};