const express = require("express");
const router = express.Router();
const multer = require("multer");
const { generateQuiz, convertQuiz } = require("../controllers/aiController");
const auth = require("../middleware/auth");

// Multer setup: single file upload, max 10 MB
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// All routes require authentication
router.use(auth);

// Generate a new quiz (from text or file)
router.post("/generate-quiz", upload.single("file"), generateQuiz);

// Convert an existing quiz file into online JSON
router.post("/convert-quiz", upload.single("file"), convertQuiz);

module.exports = router;
