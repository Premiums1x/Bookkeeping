import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  timeout: 8000,
  withCredentials: true
});

http.interceptors.request.use((config) => {
  const headers = config.headers || {};
  headers["X-Requested-With"] = "XMLHttpRequest";
  config.headers = headers;
  return config;
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === "object" && "success" in payload) {
      if (payload.success) return payload.data;
      return Promise.reject(new Error(payload.message || "请求失败"));
    }
    return payload;
  },
  (error) => {
    const message = error?.response?.data?.message || error?.message || "网络请求失败";
    return Promise.reject(new Error(message));
  }
);

export default http;
