const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const HostedQuiz = require("../models/HostedQuiz");

// GET /quiz — get all quizzes for logged-in user
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /quiz/:id — get full quiz for editing (owner only)
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Not found" });
    if (!quiz.ownerId.equals(req.user._id)) return res.status(403).json({ error: "Forbidden" });
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /quiz — create
const createQuiz = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const quiz = await Quiz.create({
      ownerId: req.user._id,
      title,
      description,
      questions,
    });

    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /quiz/:id — update quiz (owner only)
const updateQuiz = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Not found" });
    if (!quiz.ownerId.equals(req.user._id)) return res.status(403).json({ error: "Forbidden" });

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = questions;

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /quiz/:id — delete quiz (owner only)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Not found" });
    if (!quiz.ownerId.equals(req.user._id)) return res.status(403).json({ error: "Forbidden" });

    await quiz.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /quiz/:quizId/analytics — secure analytics endpoint
const getQuizAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;
    if (!quizId) return res.status(400).json({ error: "quizId is required" });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (!quiz.ownerId.equals(req.user._id)) return res.status(403).json({ error: "Forbidden" });

    // Fetch all hosted quizzes for this quizId
    const hostedQuizzes = await HostedQuiz.find({ quizId }).sort({ createdAt: -1 }).lean();
    if (!hostedQuizzes.length) return res.json([]);

    // Fetch all attempts for this quizId
    const attempts = await Attempt.find({ quizId }).lean();

    // Group attempts by sessionId (hosted quiz)
    const sessions = hostedQuizzes.map((hosted) => {
      const sessionAttempts = attempts
        .filter((a) => a.sessionId === hosted.sessionId)
        .map((a) => ({
          userName: a.name,
          correct: a.correctCount,
          total: a.total,
          scorePercent: ((a.correctCount / a.total) * 100).toFixed(1),
        }));

      return {
        sessionId: hosted.sessionId,
        createdAt: hosted.createdAt,
        attempts: sessionAttempts.sort((a, b) => b.scorePercent - a.scorePercent),
      };
    });

    res.json(sessions);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};


module.exports = {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizAnalytics,
};
