const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    hostedQuizId: { type: mongoose.Schema.Types.ObjectId, ref: "HostedQuiz", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },

    answers: {
      type: Object,
      required: true,
    },

    score: { type: Number, required: true },
    total: { type: Number, required: true },
    correctCount: { type: Number, required: true },

    details: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String },
        correct: { type: Boolean, required: true },
        submittedAnswer: { type: mongoose.Schema.Types.Mixed },
        correctAnswer: { type: mongoose.Schema.Types.Mixed },
        type: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);
