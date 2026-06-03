const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateBody, userCreateSchema } = require("../middleware/validate");

router.post("/register", validateBody(userCreateSchema), authController.register);
router.post("/login", authController.login);

module.exports = router;
