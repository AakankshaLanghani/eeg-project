const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(path, opts = {}) {
  const r = await fetch(BASE + path, opts);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return r.json();
}

export const login         = (email, password)      => req("/api/login", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, password }) });
export const classifyEEG   = ()                     => req("/api/eeg/classify");
export const getWaveform   = ()                     => req("/api/eeg/waveform");
export const getPatients   = ()                     => req("/api/patients");
export const getPatient    = (id)                   => req(`/api/patients/${id}`);
export const getNotes      = (id)                   => req(`/api/patients/${id}/notes`);
export const addNote       = (patient_id, note)     => req("/api/patients/notes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ patient_id, note }) });
export const getAlerts     = ()                     => req("/api/alerts");
export const ackAlert      = (alert_id)             => req("/api/alerts/acknowledge", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ alert_id }) });
export const createAlert   = (alert)                => req("/api/alerts/create", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(alert) });
export const getStats      = ()                     => req("/api/stats");
export const getSettings   = ()                     => req("/api/settings");
export const updateSettings= (data)                 => req("/api/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
export const getAnalytics  = ()                     => req("/api/analytics");
export const listUploads   = ()                     => req("/api/upload-data");
export const uploadData    = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return req("/api/upload-data", { method:"POST", body: fd });
};

// ── Messaging ──
export const getMessages  = (patient_id)                => req(`/api/messages/${patient_id}`);
export const sendMessage  = (patient_id, sender_role, content) => req("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ patient_id, sender_role, content }) });

// ── EEG Sessions ──
export const getSessions      = (patient_id)    => req(`/api/sessions${patient_id ? `?patient_id=${patient_id}` : ""}`);
export const startSession     = (patient_id, label) => req("/api/sessions/start",   { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ patient_id, label }) });
export const stopSession      = (session_id)    => req(`/api/sessions/${session_id}/stop`, { method:"POST" });
export const addRecording     = (data)          => req("/api/sessions/record",       { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
export const getRecordings    = (session_id)    => req(`/api/sessions/${session_id}/recordings`);

// ── Schedules ──
export const getSchedules     = (doctor_email)  => req(`/api/schedules${doctor_email ? `?doctor_email=${encodeURIComponent(doctor_email)}` : ""}`);
export const createSchedule   = (data)          => req("/api/schedules",             { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
export const updateSchedule   = (id, data)      => req(`/api/schedules/${id}`,       { method:"PUT",  headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
export const deleteSchedule   = (id)            => req(`/api/schedules/${id}`,       { method:"DELETE" });

// ── PDF Report ──
export const downloadReport   = (patient_id)    => `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/patients/${patient_id}/report`;

// ── Admin ──
const j = (data) => ({ headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
export const getAdminStats       = ()           => req("/api/admin/stats");
export const getAdminUsers       = ()           => req("/api/admin/users");
export const createAdminUser     = (data)       => req("/api/admin/users",                              { method:"POST",   ...j(data) });
export const updateAdminUser     = (email,data) => req(`/api/admin/users/${encodeURIComponent(email)}`, { method:"PUT",    ...j(data) });
export const deleteAdminUser     = (email)      => req(`/api/admin/users/${encodeURIComponent(email)}`, { method:"DELETE" });
export const addAdminPatient     = (data)       => req("/api/admin/patients",                           { method:"POST",   ...j(data) });
export const updateAdminPatient  = (id,data)    => req(`/api/admin/patients/${id}`,                     { method:"PUT",    ...j(data) });
export const deleteAdminPatient  = (id)         => req(`/api/admin/patients/${id}`,                     { method:"DELETE" });
export const getAdminAuditLog    = ()           => req("/api/admin/audit-log?limit=200");
export const getAdminAlertRules  = ()           => req("/api/admin/alert-rules");
export const updateAdminAlertRules = (data)     => req("/api/admin/alert-rules",                        { method:"POST",   ...j(data) });
