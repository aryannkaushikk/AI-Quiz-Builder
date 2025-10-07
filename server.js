require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const hostRoutes = require("./routes/host");
const takeRoutes = require("./routes/take");
const aiRoutes = require("./routes/ai");
const Attempt = require("./models/Attempt");
const HostedQuiz = require("./models/HostedQuiz");

const app = express();
app.use(cors({
  origin: ['https://ai-quiz-builder-omega.vercel.app', 'http://localhost:5173'],
  methods: ['GET','POST','PUT','DELETE']
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

connectDB(process.env.MONGO_URI);

app.get("/", (req, res) => res.send("Quiz API running"));

app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);
app.use("/host", hostRoutes);
app.use("/takequiz", takeRoutes);
app.use("/api", aiRoutes);

// global error handler (basic)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

// app.get("/:quizId", async (req, res) => {
//   try {
//     const { quizId } = req.params;

//     const attempts = await Attempt.find({ quizId }).sort({ createdAt: -1 });

//     res.json({ attempts });
//   } catch (err) {
//     console.error("Error fetching attempts:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.delete("/attempts", async (req, res) => {
//   try {
//     const result = await Attempt.deleteMany({});
//     res.json({ message: `Deleted ${result.deletedCount} attempts.` });
//   } catch (err) {
//     console.error("Delete all attempts error:", err);
//     res.status(500).json({ error: "Failed to delete attempts." });
//   }
// });

// // DELETE /api/hosted
// app.delete("/hosted", async (req, res) => {
//   try {
//     const result = await HostedQuiz.deleteMany({});
//     res.json({ message: `Deleted ${result.deletedCount} hosted quizzes.` });
//   } catch (err) {
//     console.error("Delete all hosted quizzes error:", err);
//     res.status(500).json({ error: "Failed to delete hosted quizzes." });
//   }
// });


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
