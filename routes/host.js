const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { hostQuiz, getHosted, stopHost } = require("../controllers/hostController");

router.use(auth);
router.post("/", hostQuiz); // host a quiz
router.get("/:quizId", getHosted);
router.post("/:sessionId/stop", stopHost);

module.exports = router;
