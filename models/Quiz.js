const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed }, // keep original id if used
  type: { type: String, required: true }, // "MCQ", "Multi MCQ", "True/False", "One Word", "Subjective"
  text: { type: String, required: true },
  options: { type: [String], default: [] }, // for MCQ / True/False
  answer: { type: mongoose.Schema.Types.Mixed }, // string or array for multi
  explanation: { type: String, default: "" }
});

const QuizSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  questions: { type: [QuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Quiz", QuizSchema);
