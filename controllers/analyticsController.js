const Task = require("../models/taskModel");
const Team = require("../models/teamModel");

// Analytics cho toàn hệ thống - chỉ admin
exports.getSystemAnalytics = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    const statusCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const priorityCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const totalTasks = await Task.countDocuments(filter);
    const totalUsers = await require("../models/userModel").countDocuments();
    const totalTeams = await Team.countDocuments();

    res.json({ 
      status: statusCounts, 
      priority: priorityCounts,
      summary: {
        totalTasks,
        totalUsers,
        totalTeams
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
