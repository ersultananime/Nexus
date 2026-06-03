const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { getAuthUser, checkRole } = require("../middleware/auth");
const { validateBody, projectCreateSchema, sprintCreateSchema } = require("../middleware/validate");

router.get("/", getAuthUser, projectController.getAllProjects);
router.get("/:id", getAuthUser, projectController.getProjectById);
router.post("/", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), validateBody(projectCreateSchema), projectController.createProject);
router.put("/:id", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), validateBody(projectCreateSchema), projectController.updateProject);
router.delete("/:id", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), projectController.deleteProject);

router.get("/:projectId/sprints", getAuthUser, projectController.getSprints);
router.post("/:projectId/sprints", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), validateBody(sprintCreateSchema), projectController.createSprint);
router.put("/:projectId/sprints/:sprintId", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), validateBody(sprintCreateSchema), projectController.updateSprint);
router.delete("/:projectId/sprints/:sprintId", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), projectController.deleteSprint);

module.exports = router;
