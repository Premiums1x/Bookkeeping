import http from "./http";

export function fetchLedger() {
  return http.get("/ledger");
}

export function fetchSession() {
  return http.get("/auth/session");
}

export function login(payload) {
  return http.post("/auth/login", payload);
}

export function register(payload) {
  return http.post("/auth/register", payload);
}

export function logout() {
  return http.post("/auth/logout");
}

export function changePassword(payload) {
  return http.put("/auth/password", payload);
}

export function fetchAccounts() {
  return http.get("/accounts");
}

export function createAccount(payload) {
  return http.post("/accounts", payload);
}

export function renameAccount(id, payload) {
  return http.put(`/accounts/${id}`, payload);
}

export function deleteAccount(id) {
  return http.delete(`/accounts/${id}`);
}

export function switchAccount(payload) {
  return http.put("/accounts/active", payload);
}

export function fetchRecords(params = {}) {
  return http.get("/records", { params });
}

export function createRecord(payload) {
  return http.post("/records", payload);
}

export function updateRecord(id, payload) {
  return http.put(`/records/${id}`, payload);
}

export function deleteRecord(id) {
  return http.delete(`/records/${id}`);
}

export function saveBudget(payload) {
  return http.put("/budget", payload);
}

export function savePreferences(payload) {
  return http.put("/preferences", payload);
}
