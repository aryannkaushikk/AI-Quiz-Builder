import axios from "axios";

const BACKEND_API = import.meta.env.VITE_BACKEND_API;

const getToken = () => localStorage.getItem("token");

const apiClient = axios.create({
  baseURL: BACKEND_API,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===== Quiz APIs =====
export const createQuiz = async (quizData) => {
  const res = await apiClient.post("/quiz", quizData);
  return res.data.quiz;
};

export const updateQuiz = async (quizId, quizData) => {
  const res = await apiClient.put(`/quiz/${quizId}`, quizData);
  return res.data.quiz;
};

export const getUserQuizzes = async () => {
  const res = await apiClient.get("/quiz", {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
  });
  return res.data || [];
};

export const getQuizById = async (quizId) => {
  const res = await apiClient.get(`/quiz/${quizId}`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
  });
  return res.data;
};

export const deleteQuiz = async (quizId) => {
  const res = await apiClient.delete(`/quiz/${quizId}`);
  return res.data;
};

// ===== Host Quiz APIs =====

export const hostQuiz = async (options) => {
  const res = await apiClient.post(`/host`, options);  
  return res;
};

export const getActiveHostedQuiz = async (quizId) => {
  const res = await apiClient.get(`/host/${quizId}`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
  });
  return res;
};

export const stopHostingQuiz = async (sessionId) => {
  const res = await apiClient.post(`/host/${sessionId}/stop`);
  return res.data;
};

// ===== Take Quiz APIs =====
export const checkQuizAttempt = async (sessionId) => {
  const res = await apiClient.get(`/takequiz/${sessionId}/check`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
  });  
  return res.data;
};

export const getTakeQuiz = async (sessionId) => {
  const res = await apiClient.get(`/takequiz/${sessionId}`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
  });  
  return res.data;
};

export const submitTakeQuiz = async (sessionId, payload) => {
  const res = await apiClient.post(`/takequiz/${sessionId}/submit`, payload);  
  return res.data;
};

// ===== AI Quiz Generation =====
export const generateAIQuiz = async ({
  source,
  num_questions,
  difficulties,
  question_types,
}) => {
  if (!source) throw new Error("source required");

  const res = await apiClient.post("/api/generate-quiz", {
    source,
    num_questions,
    difficulties,
    question_types,
  });

  if (!res.data.quiz || !Array.isArray(res.data.quiz)) {
    throw new Error("AI returned invalid quiz format");
  }

  return res.data.quiz.map((q) => ({
    id: Date.now() + Math.random(),
    type: q.type || "MCQ",
    text: q.text || "",
    options: q.options || (q.type.includes("MCQ") ? ["", "", "", ""] : []),
    answer: q.type.includes("Multi") ? [] : q.answer || "",
    explanation: q.explanation || "",
  }));
};

// ===== Analytics APIs =====
export const fetchQuizAnalytics = async (quizId) => {
  if (!quizId) throw new Error("quizId is required");
  const res = await apiClient.get(`/quiz/${quizId}/analytics`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
  });
  return res || [];
};
