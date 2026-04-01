const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.use(auth);

router.get("/logs", authorize("admin"), logController.getAllLogs);
router.get("/logs/:taskId", logController.getLogsByTaskId);

module.exports = router;
