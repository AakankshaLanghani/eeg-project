const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Token storage ────────────────────────────────────────────────────────────
let _token = null;
export const setToken   = (t) => { _token = t; };
export const clearToken = ()  => { _token = null; };

// ─── Core request helper ──────────────────────────────────────────────────────
async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };

  // Attach JWT to every request except login
  if (_token && !path.includes("/api/login")) {
    headers["Authorization"] = `Bearer ${_token}`;
  }

  // Only set Content-Type for JSON bodies (not FormData)
  if (opts.body && typeof opts.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const r = await fetch(BASE + path, { ...opts, headers });

  if (r.status === 401) {
    // Token expired — clear and reload to login
    clearToken();
    window.location.reload();
    return;
  }

  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return r.json();
}

const j = (data) => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  req("/api/login", { method: "POST", ...j({ email, password }) });

// ─── EEG ─────────────────────────────────────────────────────────────────────
export const classifyEEG = (patient_id = 1) =>
  req(`/api/eeg/classify?patient_id=${patient_id}`);
export const getWaveform = (patient_id = 1) =>
  req(`/api/eeg/waveform?patient_id=${patient_id}`);

// ─── Patients ────────────────────────────────────────────────────────────────
export const getPatients = ()      => req("/api/patients");
export const getPatient  = (id)    => req(`/api/patients/${id}`);
export const getNotes    = (id)    => req(`/api/patients/${id}/notes`);
export const addNote     = (patient_id, note) =>
  req("/api/patients/notes", { method: "POST", ...j({ patient_id, note }) });

// ─── Alerts ──────────────────────────────────────────────────────────────────
export const getAlerts   = ()          => req("/api/alerts");
export const ackAlert    = (alert_id)  => req("/api/alerts/acknowledge", { method: "POST", ...j({ alert_id }) });
export const createAlert = (alert)     => req("/api/alerts/create",      { method: "POST", ...j(alert) });

// ─── Stats & Analytics ───────────────────────────────────────────────────────
export const getStats    = () => req("/api/stats");
export const getAnalytics= () => req("/api/analytics");

// ─── Settings ────────────────────────────────────────────────────────────────
export const getSettings    = ()     => req("/api/settings");
export const updateSettings = (data) => req("/api/settings", { method: "POST", ...j(data) });

// ─── Upload ──────────────────────────────────────────────────────────────────
export const listUploads = () => req("/api/upload-data");
export const uploadData  = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return req("/api/upload-data", { method: "POST", body: fd });
};

// ─── Messaging ───────────────────────────────────────────────────────────────
export const getMessages = (patient_id) => req(`/api/messages/${patient_id}`);
export const sendMessage = (patient_id, sender_role, content) =>
  req("/api/messages", { method: "POST", ...j({ patient_id, sender_role, content }) });

// ─── EEG Sessions ────────────────────────────────────────────────────────────
export const getSessions   = (patient_id)        => req(`/api/sessions${patient_id ? `?patient_id=${patient_id}` : ""}`);
export const startSession  = (patient_id, label) => req("/api/sessions/start",              { method: "POST", ...j({ patient_id, label }) });
export const stopSession   = (session_id)        => req(`/api/sessions/${session_id}/stop`, { method: "POST" });
export const addRecording  = (data)              => req("/api/sessions/record",              { method: "POST", ...j(data) });
export const getRecordings = (session_id)        => req(`/api/sessions/${session_id}/recordings`);

// ─── Schedules ───────────────────────────────────────────────────────────────
export const getSchedules    = (doctor_email) => req(`/api/schedules${doctor_email ? `?doctor_email=${encodeURIComponent(doctor_email)}` : ""}`);
export const createSchedule  = (data)         => req("/api/schedules",       { method: "POST",   ...j(data) });
export const updateSchedule  = (id, data)     => req(`/api/schedules/${id}`, { method: "PUT",    ...j(data) });
export const deleteSchedule  = (id)           => req(`/api/schedules/${id}`, { method: "DELETE" });

// ─── PDF Report ──────────────────────────────────────────────────────────────
export const downloadReport = async (patient_id) => {
  // Fetch with Authorization header, then trigger browser download from blob
  const r = await fetch(`${BASE}/api/patients/${patient_id}/report`, {
    headers: { Authorization: `Bearer ${_token}` },
  });
  if (!r.ok) throw new Error("Failed to generate report");
  const blob = await r.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `NeuroTrack_Report_Patient${patient_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const getAdminStats         = ()             => req("/api/admin/stats");
export const getAdminUsers         = ()             => req("/api/admin/users");
export const createAdminUser       = (data)         => req("/api/admin/users",                              { method: "POST",   ...j(data) });
export const updateAdminUser       = (email, data)  => req(`/api/admin/users/${encodeURIComponent(email)}`, { method: "PUT",    ...j(data) });
export const deleteAdminUser       = (email)        => req(`/api/admin/users/${encodeURIComponent(email)}`, { method: "DELETE" });
export const addAdminPatient       = (data)         => req("/api/admin/patients",                           { method: "POST",   ...j(data) });
export const updateAdminPatient    = (id, data)     => req(`/api/admin/patients/${id}`,                     { method: "PUT",    ...j(data) });
export const deleteAdminPatient    = (id)           => req(`/api/admin/patients/${id}`,                     { method: "DELETE" });
export const getAdminAuditLog      = ()             => req("/api/admin/audit-log?limit=200");
export const getAdminAlertRules    = ()             => req("/api/admin/alert-rules");
export const updateAdminAlertRules = (data)         => req("/api/admin/alert-rules", { method: "POST", ...j(data) });
