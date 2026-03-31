const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { auth } = require("../middleware/authMiddleware");

router.use(auth);

router.get("/comments/:taskId", commentController.getCommentsByTaskId);
router.post("/comments/:taskId", commentController.addComment);
router.delete("/comments/:commentId", commentController.deleteComment);

module.exports = router;
