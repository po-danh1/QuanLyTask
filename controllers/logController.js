const Log = require("../models/logModel");
const Task = require("../models/taskModel");

exports.getLogsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      userId: req.user.id,
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found or access denied" });
    }

    const logs = await Log.find({ taskId })
      .populate("userId", "username email avatar")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
