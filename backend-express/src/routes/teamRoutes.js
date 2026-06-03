const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { getAuthUser, checkRole } = require("../middleware/auth");
const { validateBody, teamCreateSchema } = require("../middleware/validate");

router.get("/match", getAuthUser, checkRole(["STUDENT"]), teamController.matchTeams);
router.get("/", getAuthUser, teamController.getAllTeams);
router.get("/:id", getAuthUser, teamController.getTeamById);
router.post("/", getAuthUser, validateBody(teamCreateSchema), teamController.createTeam);
router.put("/:id", getAuthUser, validateBody(teamCreateSchema), teamController.updateTeam);
router.delete("/:id", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), teamController.deleteTeam);
router.post("/:id/join", getAuthUser, checkRole(["STUDENT"]), teamController.joinTeam);
router.post("/:id/leave", getAuthUser, checkRole(["STUDENT"]), teamController.leaveTeam);
router.post("/:id/members/:userId", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), teamController.addMember);
router.delete("/:id/members/:userId", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), teamController.removeMember);

module.exports = router;
