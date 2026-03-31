const Task = require("../models/taskModel");
const Log = require("../models/logModel");

exports.addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const attachment = {
      name: req.file.originalname,
      path: req.file.path.replace(/\\/g, "/"),
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $push: { attachments: attachment } },
      { new: true }
    );

    await Log.create({
      action: "updated",
      userId: req.user.id,
      taskId: task._id,
      details: `Đã đính kèm tệp: ${attachment.name}`
    });

    res.json(task);
    req.app.get("io").emit("taskChange", { action: "update", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { attachments: { _id: attachmentId } } },
      { new: true }
    );
    res.json(task);
    req.app.get("io").emit("taskChange", { action: "update", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
