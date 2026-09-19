const mongoose = require('mongoose');
const Project = require('../models/Project');


exports.getProjectIfMember = async (projectId, userId) => {
  if (!mongoose.isObjectIdOrHexString(projectId)) return null;

  const project = await Project.findById(projectId);
  if (!project) return null;

  const isMember = project.members.some((m) => m.equals(userId));
  return isMember ? project : null;
};