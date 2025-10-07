const express = require("express");
const router = express.Router();
const { generateQuiz } = require("../controllers/aiController");
const auth = require("../middleware/auth");

router.post("/generate-quiz", auth, generateQuiz);

module.exports = router;
