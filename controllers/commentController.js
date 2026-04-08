const Comment = require("../models/commentModel");
const Task = require("../models/taskModel");
const Notification = require("../models/notificationModel");

exports.getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Kiểm tra task có tồn tại và thuộc về user không (hoặc không bị xóa)
    const task = await Task.findOne({
      _id: taskId,
      userId: req.user.id,
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found or access denied" });
    }

    const comments = await Comment.find({ taskId })
      .populate("userId", "username email avatar")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Kiểm tra task
    const task = await Task.findOne({
      _id: taskId,
      userId: req.user.id,
      isDeleted: false
    });

    if (!task) {
      console.log("Add comment failed: Task not found", taskId, req.user.id);
      return res.status(404).json({ message: "Task not found or access denied" });
    }

    const comment = new Comment({
      text,
      taskId,
      userId: req.user.id
    });

    await comment.save();
    
    // Nạp thêm thông tin user để trả về ngay cho frontend hiển thị
    const populatedComment = await comment.populate("userId", "username email avatar");
    console.log("Comment added successfully", populatedComment._id);

    req.app.get("io").emit("commentAdded", { taskId, comment: populatedComment });

    // Tạo notification cho chủ task và assignee
    const io = req.app.get("io");
    const commenterName = populatedComment.userId?.username || "Someone";
    
    // Thông báo cho chủ task (nếu không phải người comment)
    if (task.userId.toString() !== req.user.id) {
      const notification = await Notification.create({
        userId: task.userId,
        title: "Bình luận mới trên task của bạn",
        message: `${commenterName} đã bình luận: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        type: "task",
        link: `/tasks/${taskId}`
      });
      io.to(task.userId.toString()).emit("notification", notification);
    }
    
    // Thông báo cho assignee (nếu có và khác người comment)
    if (task.assigneeId && task.assigneeId.toString() !== req.user.id && task.assigneeId.toString() !== task.userId.toString()) {
      const notification = await Notification.create({
        userId: task.assigneeId,
        title: "Bình luận mới trên task được gán cho bạn",
        message: `${commenterName} đã bình luận: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        type: "task",
        link: `/tasks/${taskId}`
      });
      io.to(task.assigneeId.toString()).emit("notification", notification);
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findOne({
      _id: commentId,
      userId: req.user.id // Chỉ người tạo mới được xóa
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found or access denied" });
    }

    await Comment.deleteOne({ _id: commentId });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
