const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { getAuthUser } = require("../middleware/auth");
const { validateBody, taskCreateSchema } = require("../middleware/validate");

router.get("/", getAuthUser, taskController.getAllTasks);
router.get("/:id", getAuthUser, taskController.getTaskById);
router.post("/", getAuthUser, validateBody(taskCreateSchema), taskController.createTask);
router.put("/:id", getAuthUser, validateBody(taskCreateSchema), taskController.updateTask);
router.delete("/:id", getAuthUser, taskController.deleteTask);

module.exports = router;
