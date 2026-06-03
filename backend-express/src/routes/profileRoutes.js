const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { getAuthUser, checkRole } = require("../middleware/auth");
const { validateBody, profileUpdateSchema } = require("../middleware/validate");

router.get("/me", getAuthUser, checkRole(["STUDENT"]), profileController.getProfileMe);
router.put("/me", getAuthUser, checkRole(["STUDENT"]), validateBody(profileUpdateSchema), profileController.updateProfileMe);
router.get("/", getAuthUser, profileController.getAllProfiles);
router.get("/:userId", getAuthUser, profileController.getProfileById);
router.put("/:userId", getAuthUser, validateBody(profileUpdateSchema), profileController.updateProfileById);

module.exports = router;
