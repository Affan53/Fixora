import axios from "axios";

// Points at the Spring Boot backend. Set VITE_API_URL in a .env file,
// e.g. VITE_API_URL=http://localhost:8080/api  (or your Render URL in prod)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

// Attach JWT to every request once the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fixora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expires, boot back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fixora_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
