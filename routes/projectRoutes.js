const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth } = require("../middleware/authMiddleware");

router.use(auth);

router.post("/projects", projectController.createProject);
router.get("/projects", projectController.getProjects);
router.delete("/projects/:projectId", projectController.deleteProject);

module.exports = router;
