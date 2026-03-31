const TimeLog = require("../models/timeLogModel");
const Task = require("../models/taskModel");

// Bắt đầu ghi thời gian cho một task
exports.startTimeLog = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Kiểm tra xem có log nào đang chạy không
    const runningLog = await TimeLog.findOne({ userId, endTime: null });
    if (runningLog) {
      return res.status(400).json({ message: "Bạn đang có một phiên làm việc khác chưa kết thúc" });
    }

    const newLog = new TimeLog({
      userId,
      taskId,
      startTime: Date.now(),
      note: req.body.note || ""
    });

    await newLog.save();
    res.status(201).json({ message: "Đã bắt đầu ghi nhận thời gian", log: newLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kết thúc ghi thời gian
exports.stopTimeLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { logId } = req.params;

    const log = await TimeLog.findOne({ _id: logId, userId, endTime: null });
    if (!log) {
      return res.status(404).json({ message: "Không tìm thấy phiên làm việc đang chạy" });
    }

    log.endTime = Date.now();
    // Tính toán thời gian theo phút
    const diffMs = log.endTime - log.startTime;
    log.duration = Math.floor(diffMs / 60000); // 1 phút = 60.000 ms

    await log.save();
    res.json({ message: "Đã kết thúc phiên làm việc", log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy lịch sử làm việc của một task
exports.getTaskLogs = async (req, res) => {
  try {
    const { taskId } = req.params;
    const logs = await TimeLog.find({ taskId }).populate("userId", "username email");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tổng quan thời gian của người dùng
exports.getMyLogs = async (req, res) => {
  try {
    const logs = await TimeLog.find({ userId: req.user.id }).populate("taskId", "title");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
