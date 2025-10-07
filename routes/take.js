const express = require("express");
const router = express.Router();
const { getTakeQuiz, submitTakeQuiz, checkAttemptEligibility } = require("../controllers/takeController");
const auth = require("../middleware/auth");

router.use(auth);

// Public fetch of hosted quiz
router.get("/:sessionId", getTakeQuiz);

// Submissions: allow anonymous too - optional auth
router.post("/:sessionId/submit", submitTakeQuiz);

// Check if User can attempt test
router.get("/:sessionId/check", checkAttemptEligibility);

module.exports = router;
