const BASE = "https://eeg-project-production.up.railway.app";

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.error(`API error [${path}]:`, e.message);
    throw e;
  }
}

// Auth
export const login = (email, password) =>
  request("/login", { method: "POST", body: JSON.stringify({ email, password }) });

// EEG
export const classifyEEG  = () => request("/eeg/classify");
export const getWaveform  = () => request("/eeg/waveform");

// Patients
export const getPatients  = () => request("/patients");
export const getPatient   = (id) => request(`/patients/${id}`);
export const getNotes     = (id) => request(`/patients/${id}/notes`);
export const addNote      = (patient_id, note) =>
  request("/patients/notes", { method: "POST", body: JSON.stringify({ patient_id, note }) });

// Alerts
export const getAlerts    = () => request("/alerts");
export const ackAlert     = (alert_id) =>
  request("/alerts/acknowledge", { method: "POST", body: JSON.stringify({ alert_id }) });
export const createAlert  = (alert) =>
  request("/alerts/create", { method: "POST", body: JSON.stringify(alert) });

// Stats
export const getStats     = () => request("/stats");