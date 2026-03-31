const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#3498db" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Label", labelSchema);
