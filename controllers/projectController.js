const Project = require("../models/projectModel");

exports.createProject = async (req, res) => {
  try {
    const { name, description, teamId } = req.body;
    const project = new Project({
      name,
      description,
      ownerId: req.user.id,
      teamId: teamId || null
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ ownerId: req.user.id }, { teamId: { $ne: null } }]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
