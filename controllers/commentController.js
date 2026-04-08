const Comment = require("../models/commentModel");
const Task = require("../models/taskModel");
const Team = require("../models/teamModel");
const Notification = require("../models/notificationModel");

// Helper: Check if user has access to task (owner, assignee, or team member)
async function hasTaskAccess(task, userId) {
  console.log("Checking task access:", {
    taskId: task._id.toString(),
    taskUserId: task.userId?.toString(),
    taskAssigneeId: task.assigneeId?.toString(),
    taskTeamId: task.teamId?.toString(),
    requestingUserId: userId
  });
  
  // Owner has access
  if (task.userId.toString() === userId) {
    console.log("Access granted: User is task owner");
    return true;
  }
  
  // Assignee has access
  if (task.assigneeId && task.assigneeId.toString() === userId) {
    console.log("Access granted: User is task assignee");
    return true;
  }
  
  // Team member has access
  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    console.log("Team found:", team ? { 
      teamId: team._id.toString(), 
      ownerId: team.ownerId?.toString(),
      members: team.members.map(m => ({ userId: m.userId?.toString(), role: m.role }))
    } : "No team");
    
    if (team) {
      const isMember = team.members.some(m => m.userId.toString() === userId);
      const isOwner = team.ownerId.toString() === userId;
      console.log("Team check:", { isMember, isOwner });
      if (isMember || isOwner) {
        console.log("Access granted: User is team member or owner");
        return true;
      }
    }
  }
  
  console.log("Access denied: No matching permission");
  return false;
}

exports.getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log("GET /api/comments/:taskId - User:", req.user?.id, "Task:", taskId);

    // Find task (not deleted)
    const task = await Task.findOne({
      _id: taskId,
      isDeleted: false
    });

    if (!task) {
      console.log("Task not found:", taskId);
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access permission
    const hasAccess = await hasTaskAccess(task, req.user.id);
    if (!hasAccess) {
      console.log("Access denied for user:", req.user.id, "on task:", taskId);
      return res.status(403).json({ message: "Access denied" });
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
    console.log("POST /api/comments/:taskId - User:", req.user?.id, "Task:", taskId, "Text:", text?.substring(0, 30));

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Find task (not deleted)
    const task = await Task.findOne({
      _id: taskId,
      isDeleted: false
    });

    if (!task) {
      console.log("Add comment failed: Task not found", taskId, req.user.id);
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access permission
    const hasAccess = await hasTaskAccess(task, req.user.id);
    if (!hasAccess) {
      console.log("Add comment access denied for user:", req.user.id, "on task:", taskId);
      return res.status(403).json({ message: "Access denied" });
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
        type: "comment",
        link: `/tasks/${taskId}`
      });
      io.to(task.userId.toString()).emit("notification", notification);
    }
    
    // Thông báo cho assignee (nếu có và khác người comment)
    if (task.assigneeId && 
        task.assigneeId.toString() !== req.user.id && 
        task.assigneeId.toString() !== task.userId?.toString()) {
      const notification = await Notification.create({
        userId: task.assigneeId,
        title: "Bình luận mới trên task được gán cho bạn",
        message: `${commenterName} đã bình luận: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        type: "comment",
        link: `/tasks/${taskId}`
      });
      io.to(task.assigneeId.toString()).emit("notification", notification);
    }
    
    // Thông báo cho các team members khác (nếu task thuộc team)
    if (task.teamId) {
      const team = await Team.findById(task.teamId);
      if (team) {
        const notifiedUsers = new Set([
          task.userId.toString(), 
          req.user.id
        ]);
        if (task.assigneeId) notifiedUsers.add(task.assigneeId.toString());
        
        for (const member of team.members) {
          const memberId = member.userId.toString();
          // Skip if already notified or is the commenter
          if (notifiedUsers.has(memberId)) continue;
          
          const notification = await Notification.create({
            userId: member.userId,
            title: "Bình luận mới trong team task",
            message: `${commenterName} đã bình luận: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
            type: "comment",
            link: `/tasks/${taskId}`
          });
          io.to(memberId).emit("notification", notification);
          notifiedUsers.add(memberId);
        }
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper: Check if user can delete comment (owner of comment, task owner, or team admin)
async function canDeleteComment(comment, userId) {
  // Comment owner can delete
  if (comment.userId.toString() === userId) return true;
  
  // Get task to check permissions
  const task = await Task.findById(comment.taskId);
  if (!task) return false;
  
  // Task owner can delete
  if (task.userId.toString() === userId) return true;
  
  // Team admin can delete
  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    if (team) {
      const isTeamOwner = team.ownerId.toString() === userId;
      const isTeamAdmin = team.members.some(m => 
        m.userId.toString() === userId && m.role === "admin"
      );
      if (isTeamOwner || isTeamAdmin) return true;
    }
  }
  
  return false;
}

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check delete permission
    const canDelete = await canDeleteComment(comment, req.user.id);
    if (!canDelete) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Comment.deleteOne({ _id: commentId });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
