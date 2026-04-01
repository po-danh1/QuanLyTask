const Project = require("../models/projectModel");
const Task = require("../models/taskModel");

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
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    let filter;
    if (isAdmin) {
      filter = {};
    } else {
      filter = {
        $or: [{ ownerId: userId }, { teamId: { $ne: null } }]
      };
    }
    
    const projects = await Project.find(filter);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa project - chỉ admin hoặc owner
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Chỉ admin hoặc owner mới được xóa
    if (!isAdmin && project.ownerId.toString() !== userId) {
      return res.status(403).json({ message: "Chỉ admin hoặc owner mới có quyền xóa project" });
    }

    // Xóa project và tất cả tasks liên quan
    await Project.findByIdAndDelete(projectId);
    await Task.updateMany(
      { projectId: projectId },
      { isDeleted: true }
    );

    res.json({ message: "Đã xóa project và các task liên quan" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
