const Task = require("../models/taskModel");
const Log = require("../models/logModel");
const Team = require("../models/teamModel");
const Notification = require("../models/notificationModel");

exports.getDeadlineAlerts = async (req, res) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const userId = req.user.id;
    const userTeams = await Team.find({ "members.userId": userId }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    const filter = {
      deadline: { $gte: now, $lte: in24h },
      status: { $ne: "completed" },
      isDeleted: false,
      $or: [
        { userId: userId },
        { assigneeId: userId },
        { teamId: { $in: teamIds } }
      ]
    };

    const overdueFilter = {
      deadline: { $lt: now },
      status: { $ne: "completed" },
      isDeleted: false,
      $or: [
        { userId: userId },
        { assigneeId: userId },
        { teamId: { $in: teamIds } }
      ]
    };

    const overdue = await Task.find(overdueFilter).select("title deadline status priority");
    const dueSoon = await Task.find(filter).select("title deadline status priority");

    res.json({ overdue, dueSoon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const userTeams = await Team.find({ "members.userId": userId }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    let baseFilter;
    if (isAdmin) {
      baseFilter = { isDeleted: false };
    } else {
      baseFilter = {
        isDeleted: false,
        $or: [
          { userId: userId },
          { assigneeId: userId },
          { teamId: { $in: teamIds } }
        ]
      };
    }

    const total = await Task.countDocuments(baseFilter);

    const completed = await Task.countDocuments({
      ...baseFilter,
      status: "completed"
    });

    const pending = await Task.countDocuments({
      ...baseFilter,
      status: "pending"
    });

    const overdue = await Task.countDocuments({
      ...baseFilter,
      deadline: { $lt: new Date() },
      status: { $ne: "completed" }
    });

    res.json({ total, completed, pending, overdue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      priority,
      search,
      status,
      sort = "newest"
    } = req.query;

    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const userTeams = await Team.find({ "members.userId": userId }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    let filter;
    if (isAdmin) {
      // Admin xem tất cả tasks chưa xóa
      filter = { isDeleted: false };
    } else {
      // User chỉ xem tasks của mình hoặc team mình
      filter = {
        isDeleted: false,
        $or: [
          { userId: userId },
          { assigneeId: userId },
          { teamId: { $in: teamIds } }
        ]
      };
    }

    if (priority) {
      filter.priority = priority;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
      // Hoặc nếu muốn search cả mô tả:
      // filter.$and = filter.$and || [];
      // filter.$and.push({ $or: [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }] });
    }

    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "deadline_asc") {
      sortOption = { deadline: 1, createdAt: -1 };
    } else if (sort === "priority_desc") {
      sortOption = { priority: 1, createdAt: -1 };
    }

    const tasks = await Task.find(filter)
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const userTeams = await Team.find({ "members.userId": userId }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    let query;
    if (isAdmin) {
      query = { _id: req.params.id, isDeleted: false };
    } else {
      query = {
        _id: req.params.id,
        $or: [
          { userId: userId },
          { teamId: { $in: teamIds } }
        ],
        isDeleted: false
      };
    }

    const task = await Task.findOne(query)
    .populate("userId", "username email avatar")
    .populate("assigneeId", "username email avatar")
    .populate("teamId", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, status, teamId, assigneeId } = req.body;

    const task = new Task({
      title,
      description,
      priority,
      deadline,
      status: status || "pending",
      userId: req.user.id,
      teamId: teamId || null,
      assigneeId: assigneeId || null
    });

    await task.save();

    req.app.get("io").emit("taskChange", { action: "create", task });

    await Log.create({
      action: "created",
      userId: req.user.id,
      taskId: task._id,
      details: "Đã tạo task mới"
    });

    // Tạo notification cho assignee nếu có
    if (assigneeId && assigneeId !== req.user.id) {
      const notification = await Notification.create({
        userId: assigneeId,
        title: "Bạn được gán một task mới",
        message: `Task "${title}" đã được gán cho bạn`,
        type: "task",
        link: `/tasks/${task._id}`
      });

      const io = req.app.get("io");
      io.to(assigneeId.toString()).emit("notification", notification);
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    let query;
    if (isAdmin) {
      query = { _id: req.params.id, isDeleted: false };
    } else {
      query = { _id: req.params.id, userId: req.user.id, isDeleted: false };
    }

    const oldTask = await Task.findOne(query);

    if (!oldTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );

    let details = [];
    let changesObj = [];

    if (oldTask.status !== task.status) {
      details.push(`Trạng thái: ${oldTask.status} ➔ ${task.status}`);
      changesObj.push({ field: "Trạng thái", old: oldTask.status, new: task.status });
    }
    if (oldTask.priority !== task.priority) {
      details.push(`Ưu tiên: ${oldTask.priority} ➔ ${task.priority}`);
      changesObj.push({ field: "Độ ưu tiên", old: oldTask.priority, new: task.priority });
    }
    if (req.body.title && oldTask.title !== task.title) {
      details.push("Đã đổi tiêu đề");
      changesObj.push({ field: "Tiêu đề", old: oldTask.title, new: task.title });
    }
    if (req.body.description !== undefined && oldTask.description !== task.description) {
      details.push("Đã chỉnh sửa mô tả");
      changesObj.push({ field: "Mô tả", old: oldTask.description, new: task.description });
    }
    if (req.body.deadline && (!oldTask.deadline || oldTask.deadline.toString() !== new Date(req.body.deadline).toString())) {
      details.push("Đã thay đổi Deadline");
      changesObj.push({ field: "Hạn chót", old: oldTask.deadline, new: task.deadline });
    }

    const changeText = details.length > 0 ? "Thay đổi: " + details.join(", ") : "Cập nhật thông tin task";

    if (changesObj.length > 0 || details.length > 0) {
      await Log.create({
        action: "updated",
        userId: req.user.id,
        taskId: task._id,
        details: changeText,
        changes: changesObj
      });
    }

    // Tạo notification nếu đổi assignee
    if (req.body.assigneeId && 
        oldTask.assigneeId?.toString() !== req.body.assigneeId && 
        req.body.assigneeId !== req.user.id) {
      const notification = await Notification.create({
        userId: req.body.assigneeId,
        title: "Bạn được gán một task",
        message: `Task "${task.title}" đã được gán cho bạn`,
        type: "task",
        link: `/tasks/${task._id}`
      });

      const io = req.app.get("io");
      io.to(req.body.assigneeId.toString()).emit("notification", notification);
    }

    res.json(task);
    req.app.get("io").emit("taskChange", { action: "update", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    let query;
    if (isAdmin) {
      query = { _id: req.params.id, isDeleted: false };
    } else {
      query = { _id: req.params.id, userId: req.user.id, isDeleted: false };
    }

    const task = await Task.findOneAndUpdate(
      query,
      { isDeleted: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Log.create({
      action: "deleted",
      userId: req.user.id,
      taskId: task._id,
      details: "Đã xóa task"
    });

    res.json({ message: "Task soft deleted" });
    req.app.get("io").emit("taskChange", { action: "delete", taskId: task._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkTasks = async (req, res) => {
  try {
    const { taskIds, action, status } = req.body;
    const userId = req.user.id;

    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ message: "Invalid task IDs" });
    }

    if (action === "delete") {
      await Task.updateMany(
        { _id: { $in: taskIds }, userId: userId },
        { isDeleted: true }
      );
      
      taskIds.forEach(id => {
        req.app.get("io").emit("taskChange", { action: "delete", taskId: id });
      });

      return res.json({ message: `Successfully deleted ${taskIds.length} tasks` });
    }

    if (action === "status" && status) {
      await Task.updateMany(
        { _id: { $in: taskIds }, $or: [{ userId }, { assigneeId: userId }] },
        { status }
      );

      taskIds.forEach(id => {
        req.app.get("io").emit("taskChange", { action: "update", taskId: id });
      });

      return res.json({ message: `Updated status for ${taskIds.length} tasks` });
    }

    res.status(400).json({ message: "Invalid bulk action" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};