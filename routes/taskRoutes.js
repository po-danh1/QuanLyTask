const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const subTaskController = require("../controllers/subTaskController");
const attachmentController = require("../controllers/attachmentController");
const analyticsController = require("../controllers/analyticsController");
const aiController = require("../controllers/aiController");
const timeLogController = require("../controllers/timeLogController");
const { auth } = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

router.use(auth);

router.get("/tasks/stats", taskController.getTaskStats);
router.get("/tasks/deadline-alerts", taskController.getDeadlineAlerts);
router.get("/tasks", taskController.getTasks);
router.get("/tasks/analytics", analyticsController.getAnalytics);
router.get("/tasks/:id", taskController.getTaskById);

// AI Roadmap
router.post("/ai/roadmap-suggest", aiController.generateRoadmap);
router.post("/ai/roadmap-apply", aiController.createRoadmapTasks);

router.post("/tasks/bulk", taskController.bulkTasks);
router.post("/tasks", taskController.createTask);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

// Sub-tasks
router.post("/tasks/:taskId/subtasks", subTaskController.addSubTask);
router.patch("/tasks/:taskId/subtasks/:subTaskId", subTaskController.toggleSubTask);
router.delete("/tasks/:taskId/subtasks/:subTaskId", subTaskController.deleteSubTask);

// Attachments
router.post("/tasks/:taskId/attachments", upload.single("file"), attachmentController.addAttachment);
router.delete("/tasks/:taskId/attachments/:attachmentId", attachmentController.deleteAttachment);

// Time Tracking (Model 12)
router.get("/timelogs/me", timeLogController.getMyLogs);
router.get("/tasks/:taskId/timelogs", timeLogController.getTaskLogs);
router.post("/tasks/:taskId/timelogs/start", timeLogController.startTimeLog);
router.patch("/timelogs/:logId/stop", timeLogController.stopTimeLog);

module.exports = router;