const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { auth } = require("../middleware/authMiddleware");

router.use(auth);

router.post("/teams", teamController.createTeam);
router.get("/teams", teamController.getMyTeams);
router.post("/teams/:teamId/members", teamController.addMember);
router.delete("/teams/:teamId/members/:memberId", teamController.removeMember);
router.delete("/teams/:teamId", teamController.deleteTeam);

module.exports = router;
