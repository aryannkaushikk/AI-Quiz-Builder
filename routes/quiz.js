const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getQuizzes, getQuizById, createQuiz, deleteQuiz, updateQuiz } = require("../controllers/quizController");

router.use(auth);
router.get("/", getQuizzes);
router.get("/:id", getQuizById);
router.post("/", createQuiz);
router.put("/:id", updateQuiz);
router.delete("/:id", deleteQuiz);

module.exports = router;
