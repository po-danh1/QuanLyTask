const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  changedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TaskHistory", taskHistorySchema);
