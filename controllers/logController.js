const Log = require("../models/logModel");
const Task = require("../models/taskModel");
const Team = require("../models/teamModel");

// Lấy logs theo taskId - admin xem tất cả, user chỉ xem task liên quan
exports.getLogsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Nếu không phải admin, kiểm tra quyền truy cập task
    if (!isAdmin) {
      const userTeams = await Team.find({ "members.userId": userId }).select("_id");
      const teamIds = userTeams.map(t => t._id);

      const task = await Task.findOne({
        _id: taskId,
        $or: [
          { userId: userId },
          { assigneeId: userId },
          { teamId: { $in: teamIds } }
        ],
        isDeleted: false
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found or access denied" });
      }
    }

    const logs = await Log.find({ taskId })
      .populate("userId", "username email avatar")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả logs - chỉ admin
exports.getAllLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const logs = await Log.find()
      .populate("userId", "username email avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Log.countDocuments();

    res.json({
      logs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
