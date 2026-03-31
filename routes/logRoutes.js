const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const { auth } = require("../middleware/authMiddleware");

router.use(auth);

router.get("/logs/:taskId", logController.getLogsByTaskId);

module.exports = router;
