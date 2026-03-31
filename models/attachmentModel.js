const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number },
  mimetype: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attachment", attachmentSchema);
