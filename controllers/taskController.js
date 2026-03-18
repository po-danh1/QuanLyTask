const Task = require("../models/taskModel");

exports.getTaskStats = async (req, res) => {
  try {
    const total = await Task.countDocuments({
      isDeleted: false,
      userId: req.user.id
    });

    const completed = await Task.countDocuments({
      status: "completed",
      isDeleted: false,
      userId: req.user.id
    });

    const pending = await Task.countDocuments({
      status: "pending",
      isDeleted: false,
      userId: req.user.id
    });

    const overdue = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: "completed" },
      isDeleted: false,
      userId: req.user.id
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

    const filter = {
      isDeleted: false,
      userId: req.user.id
    };

    if (priority) {
      filter.priority = priority;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
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
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false
    });

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
    const { title, description, priority, deadline, status } = req.body;

    const task = new Task({
      title,
      description,
      priority,
      deadline,
      status: status || "pending",
      userId: req.user.id
    });

    await task.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        isDeleted: false
      },
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        isDeleted: false
      },
      { isDeleted: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task soft deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};