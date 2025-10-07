const HostedQuiz = require("../models/HostedQuiz");
const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");

// GET /takequiz/:sessionId  — returns hosted quiz (questions snapshot)
const getTakeQuiz = async (req, res) => {
  try {
    const hosted = await HostedQuiz.findOne({ sessionId: req.params.sessionId });
    if (!hosted || !hosted.active) return res.status(404).json({ error: "Quiz not available" });
    res.json({ sessionId: hosted.sessionId, title: hosted.title, questions: hosted.questions, timeLimit: hosted.timeLimit, startTime: hosted.startTime, endTime: hosted.endTime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /takequiz/:sessionId/submit  — submit answers, evaluate and store attempt
const submitTakeQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const { sessionId } = req.params;

    const hosted = await HostedQuiz.findOne({ sessionId });
    if (!hosted) return res.status(404).json({ error: "Hosted quiz not found" });
    if (!hosted.active) return res.status(400).json({ error: "Quiz no longer active" });

    const quizDoc = await Quiz.findById(hosted.quizId);
    if (!quizDoc) return res.status(404).json({ error: "Original quiz not found" });

    const now = new Date();
    if (hosted.startTime && now < hosted.startTime)
      return res.status(400).json({ error: "Quiz not started yet" });
    if (hosted.endTime && now > hosted.endTime)
      return res.status(400).json({ error: "Quiz ended" });

    // Build correct answer map
    const answerMap = {};
    quizDoc.questions.forEach((q) => {
      const qid = q.id || q._id.toString();
      answerMap[qid] = q.answer;
    });

    let total = hosted.questions.length;
    let correctCount = 0;
    const details = [];

    hosted.questions.forEach((hq) => {
      const qid = hq.id || hq._id.toString();
      const submitted = answers[qid];
      const correct = answerMap[qid];
      const type = (hq.type || "").toLowerCase();
      let isCorrect = false;

      if (type.includes("mcq") || type === "true/false" || type === "one word") {
        if (type.includes("multi")) {
          const correctArr = Array.isArray(correct) ? correct : [correct];
          const subArr = Array.isArray(submitted) ? submitted : [];
          const a = [...new Set(correctArr.map(String))].sort();
          const b = [...new Set(subArr.map(String))].sort();
          isCorrect = a.length === b.length && a.every((v, i) => v === b[i]);
        } else {
          const correctStr = Array.isArray(correct) ? correct[0] : correct;
          if (
            submitted &&
            String(correctStr).trim().toLowerCase() === String(submitted).trim().toLowerCase()
          ) {
            isCorrect = true;
          }
        }
      }

      if (isCorrect) correctCount++;

      details.push({
        questionId: qid,
        questionText: hq.text,
        correct: isCorrect,
        submittedAnswer: submitted ?? null,
        correctAnswer: correct ?? null,
        type: hq.type,
      });
    });

    const score = correctCount;

    const attempt = await Attempt.create({
      sessionId,
      quizId: hosted.quizId,
      hostedQuizId: hosted._id,
      userId: req.user._id,
      name: req.user.name,
      answers,
      score,
      total,
      correctCount,
      details,
    });

    res.json({
      attemptId: attempt._id,
      score,
      correctCount,
      total,
      details,
    });
  } catch (err) {
    console.error("Error submitting quiz:", err);
    res.status(500).json({ error: "Server error" });
  }
};




// GET /takequiz/:sessionId/check
const checkAttemptEligibility = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const maxAttempts = 3; // set as per your rules

    const hosted = await HostedQuiz.findOne({ sessionId });
    if (!hosted || !hosted.active) return res.status(404).json({ error: "Quiz not available" });

    // Determine the user (or anonymous)
    const userId = req.user ? req.user._id : null;
    const name = req.user ? req.user.name : "Anonymous";

    // Count existing attempts
    const attemptCount = await Attempt.countDocuments({
      sessionId,
      ...(userId ? { userId } : { name })
    });

    if (attemptCount >= maxAttempts) {
      return res.json({ allowed: false, message: "Maximum attempts exceeded" });
    }

    res.json({ allowed: true, attemptsMade: attemptCount, maxAttempts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getTakeQuiz, submitTakeQuiz, checkAttemptEligibility };
