  const Quiz = require("../models/Quiz");

  // GET /quiz  — get all quizzes for logged in user
  const getQuizzes = async (req, res) => {
    try {
      const q = await Quiz.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
      res.json(q);
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
      const quiz = await Quiz.create({ ownerId: req.user._id, title, description, questions });
      res.json(quiz);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  };

  // DELETE /quiz/:id
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

  // PUT /quiz/:id — update quiz (owner only)
const updateQuiz = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Not found" });
    if (!quiz.ownerId.equals(req.user._id)) return res.status(403).json({ error: "Forbidden" });

    // Update fields
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

module.exports = { getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz };