// src/constants.js

// Available question types
export const QUESTION_TYPES = ["MCQ", "Multi MCQ", "True/False", "One Word"];

// Number of AI questions user can generate
export const AI_QUESTION_NUM = Array.from({ length: 50 }, (_, i) => i + 1);

// Difficulty levels
export const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

// Maximum file size for uploads (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Supported file types for AI generation or conversion
export const SUPPORTED_FILE_TYPES = [".pdf", ".doc", ".docx", ".txt"];
