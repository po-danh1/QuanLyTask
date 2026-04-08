const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { auth } = require("../middleware/authMiddleware");

router.use(auth);

router.get("/notifications", notificationController.getNotifications);
router.get("/notifications/unread-count", notificationController.getUnreadCount);
router.patch("/notifications/:id/read", notificationController.markAsRead);
router.patch("/notifications/read-all", notificationController.markAllAsRead);
router.delete("/notifications/:id", notificationController.deleteNotification);

module.exports = router;
