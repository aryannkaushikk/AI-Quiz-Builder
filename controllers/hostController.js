const { v4: uuidv4 } = require("uuid");
const HostedQuiz = require("../models/HostedQuiz");
const Quiz = require("../models/Quiz");

// POST /hostquiz — host a quiz (owner only)
const hostQuiz = async (req, res) => {
  try {
    const { quizId, title, description, timeLimit, startTime, endTime } = req.body;

    if (!quizId) return res.status(400).json({ error: "quizId is required" });

    const quizDoc = await Quiz.findById(quizId);
    if (!quizDoc) return res.status(404).json({ error: "Quiz not found" });
    if (!quizDoc.ownerId.equals(req.user._id))
      return res.status(403).json({ error: "Forbidden" });

    const activeHosted = await HostedQuiz.findOne({ quizId, active: true });
    if (activeHosted)
      return res.status(400).json({
        error: "This quiz is already being hosted",
        sessionId: activeHosted.sessionId,
      });

    const sessionId = uuidv4();

    const strippedQuestions = quizDoc.questions.map((q) => ({
      id: q.id || q._id,
      text: q.text,
      type: q.type,
      options: q.options || [],
      multiple: q.multiple || false,
    }));

    const hosted = await HostedQuiz.create({
      sessionId,
      quizId,
      hostId: req.user._id,
      title: title || quizDoc.title,
      description: description || quizDoc.description || "",
      questions: strippedQuestions,
      timeLimit: timeLimit || null,
      startTime: startTime || null,
      endTime: endTime || null,
      active: true,
    });

    return res.status(201).json({
      message: "Quiz hosted successfully",
      sessionId,
      hostedQuiz: hosted,
    });
  } catch (err) {
    console.error("Error hosting quiz:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /host/:quizId — get active hosted quiz (owner only)
const getHosted = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (!quiz.ownerId.equals(req.user._id))
      return res.status(403).json({ error: "Forbidden" });

    const hosted = await HostedQuiz.findOne({
      quizId: req.params.quizId,
      active: true,
    });

    if (!hosted)
      return res.status(404).json({ error: "No active hosted quiz found" });

    res.json(hosted);
  } catch (err) {
    console.error("Get hosted quiz error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /host/:sessionId/stop — stop hosting (owner only)
const stopHost = async (req, res) => {
  try {
    const hosted = await HostedQuiz.findOne({ sessionId: req.params.sessionId });
    if (!hosted) return res.status(404).json({ error: "Not found" });
    if (!hosted.hostId.equals(req.user._id))
      return res.status(403).json({ error: "Forbidden" });

    hosted.active = false;
    await hosted.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Stop host error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { hostQuiz, getHosted, stopHost };
