const Task = require("../models/taskModel");
const Log = require("../models/logModel");

exports.addSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, $or: [{ userId: req.user.id }, { teamId: { $ne: null } }] },
      { $push: { subTasks: { text, completed: false } } },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    await Log.create({
      action: "updated",
      userId: req.user.id,
      taskId: task._id,
      details: `Đã thêm công việc con: ${text}`
    });

    res.json(task);
    req.app.get("io").emit("taskChange", { action: "update", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const subTask = task.subTasks.id(subTaskId);
    if (!subTask) return res.status(404).json({ message: "Subtask not found" });

    subTask.completed = !subTask.completed;
    await task.save();

    req.app.get("io").emit("taskChange", { action: "update", task });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: taskId },
      { $pull: { subTasks: { _id: subTaskId } } },
      { new: true }
    );

    res.json(task);
    req.app.get("io").emit("taskChange", { action: "update", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
