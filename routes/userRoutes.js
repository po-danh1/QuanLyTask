const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.use(auth);

// Routes chỉ admin được truy cập
router.get("/admin/users", authorize("admin"), userController.getAllUsers);
router.patch("/admin/users/:userId/role", authorize("admin"), userController.updateUserRole);
router.delete("/admin/users/:userId", authorize("admin"), userController.deleteUser);

module.exports = router;
