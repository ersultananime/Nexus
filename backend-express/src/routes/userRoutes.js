const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { getAuthUser, checkRole } = require("../middleware/auth");
const { validateBody, userUpdateSchema } = require("../middleware/validate");

router.get("/me", getAuthUser, userController.getMe);
router.get("/", getAuthUser, checkRole(["COORDINATOR", "TEACHER"]), userController.getAllUsers);
router.get("/:id", getAuthUser, userController.getUserById);
router.put("/:id", getAuthUser, validateBody(userUpdateSchema), userController.updateUser);

module.exports = router;
