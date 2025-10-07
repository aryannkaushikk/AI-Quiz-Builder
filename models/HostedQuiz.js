const mongoose = require("mongoose");

const HostedQuizSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true }, // uuid
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String },
  description: { type: String },
  questions: { type: Array, default: [] }, // embed snapshot of questions for immutability
  timeLimit: { type: Number, default: null }, // minutes
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HostedQuiz", HostedQuizSchema);
