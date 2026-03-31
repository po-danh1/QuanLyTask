const Task = require("../models/taskModel");
const Team = require("../models/teamModel");

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userTeams = await Team.find({ "members.userId": userId }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    const filter = {
      isDeleted: false,
      $or: [
        { userId: userId },
        { assigneeId: userId },
        { teamId: { $in: teamIds } }
      ]
    };

    const statusCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const priorityCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    res.json({ status: statusCounts, priority: priorityCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
