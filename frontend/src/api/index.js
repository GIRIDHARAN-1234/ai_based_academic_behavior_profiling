import axios from "axios";

const API_BASE = "/api";

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const logout = () => api.post("/auth/logout");

// Student
export const getStudentProfile = () => api.get("/student/profile");
export const updateStudentProfile = (data) => api.put("/student/profile", data);
export const getAssignedTests = () => api.get("/student/tests");
export const submitTest = (testId, answers) => api.post(`/student/submit/${testId}`, { answers });
export const getStudentResults = () => api.get("/student/results");
export const getStudentPrediction = () => api.get("/student/prediction");
export const getStudentTrend = () => api.get("/student/trend");

// Faculty
export const getStudents = () => api.get("/faculty/students");
export const createStudent = (data) => api.post("/faculty/create-student", data);
export const createStudentBulk = (data) => api.post("/faculty/create-student-bulk", data);
export const createTest = (data) => api.post("/faculty/tests", data);
export const getFacultyTests = () => api.get("/faculty/tests");
export const assignTest = (testId, data) => api.post(`/faculty/tests/${testId}/assign`, data);
export const getFacultyAnalytics = () => api.get("/faculty/analytics");

// Admin
export const getAdminUsers = (role) => api.get("/admin/users", { params: { role } });
export const updateUserStatus = (userId, status) => api.put(`/admin/users/${userId}/status`, { status });
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
export const getAdminAnalytics = () => api.get("/admin/analytics");

// Predict
export const predictBehavior = (data) => api.post("/predict", data);

export default api;
