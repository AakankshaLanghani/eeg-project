const BASE = "http://localhost:8000";

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
