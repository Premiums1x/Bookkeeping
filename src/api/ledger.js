import http from "./http";

export function fetchLedger() {
  return http.get("/ledger");
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
