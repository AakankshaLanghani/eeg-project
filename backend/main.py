from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import math, random, time

app = FastAPI(title="NeuroTrack EEG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── IN-MEMORY STORE ────────────────────────────────────────────────────────
eeg_t = 0

PATIENTS = [
    {"id": 1, "name": "Ahmed Raza",   "age": 34, "condition": "Post-surgery",        "initials": "AR", "color": "#EDE9FE", "tc": "#6C3FF7", "emotion": "Calm",   "status": "normal"},
    {"id": 2, "name": "Fatima Malik", "age": 28, "condition": "Anxiety disorder",    "initials": "FM", "color": "#DCFCE7", "tc": "#16A34A", "emotion": "Stress", "status": "warning"},
    {"id": 3, "name": "Usman Khan",   "age": 52, "condition": "Chronic pain",        "initials": "UK", "color": "#FEE2E2", "tc": "#DC2626", "emotion": "Pain",   "status": "critical"},
    {"id": 4, "name": "Zara Hussain", "age": 19, "condition": "Epilepsy monitoring", "initials": "ZH", "color": "#EDE9FE", "tc": "#6C3FF7", "emotion": "Happy",  "status": "normal"},
    {"id": 5, "name": "Ali Hassan",   "age": 45, "condition": "TBI recovery",        "initials": "AH", "color": "#DCFCE7", "tc": "#16A34A", "emotion": "Sad",    "status": "warning"},
]

ALERTS = [
    {"id": 1, "patient": "Usman Khan",   "emotion": "Pain",   "type": "critical", "msg": "Persistent pain signals for 5+ consecutive cycles",     "time": "2 min ago",  "resolved": False},
    {"id": 2, "patient": "Fatima Malik", "emotion": "Stress", "type": "warning",  "msg": "Elevated stress detected — clinical review recommended", "time": "8 min ago",  "resolved": False},
    {"id": 3, "patient": "Ali Hassan",   "emotion": "Stress", "type": "warning",  "msg": "Stress signal rising above detection threshold",         "time": "15 min ago", "resolved": False},
]

NOTES = {}   # { patient_id: [note_str, ...] }

USERS = {
    "dr.johnson@hospital.com": {"password": "password", "role": "Doctor",  "name": "Dr. Ummelaila"},
    "patient@hospital.com":    {"password": "password", "role": "Patient", "name": "Ahmed Raza"},
}

# ─── HELPERS ─────────────────────────────────────────────────────────────────
def get_eeg_bands():
    global eeg_t
    eeg_t += 1
    t = eeg_t
    return {
        "alpha": round(0.3 + 0.4 * math.sin(t * 0.05) + 0.1 * random.random(), 4),
        "beta":  round(0.2 + 0.5 * math.sin(t * 0.08 + 1) + 0.1 * random.random(), 4),
        "theta": round(0.4 + 0.3 * math.sin(t * 0.03 + 2) + 0.1 * random.random(), 4),
        "delta": round(0.5 + 0.3 * math.sin(t * 0.02 + 3) + 0.1 * random.random(), 4),
    }

def classify_emotion(bands):
    alpha, beta, theta, delta = bands["alpha"], bands["beta"], bands["theta"], bands["delta"]
    r = alpha / max(beta, 0.01)
    if r < 0.4 and beta > 0.6:              return "Pain"
    if r < 0.6 and beta > 0.45:             return "Stress"
    if alpha > 0.55 and beta < 0.35:        return "Calm"
    if theta > 0.55 and delta > 0.55:       return "Sad"
    return random.choice(["Happy", "Happy", "Happy", "Calm"]) # weighted toward positive

# ─── SCHEMAS ─────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class NoteRequest(BaseModel):
    patient_id: int
    note: str

class AlertAckRequest(BaseModel):
    alert_id: int

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "NeuroTrack EEG API is running", "version": "1.0.0"}

# -- Auth
@app.post("/api/login")
def login(req: LoginRequest):
    user = USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"success": True, "role": user["role"], "name": user["name"], "email": req.email}

# -- EEG
@app.get("/api/eeg/classify")
def eeg_classify():
    bands = get_eeg_bands()
    emotion = classify_emotion(bands)
    confidence = round(random.uniform(70, 96), 1)
    return {
        "emotion":    emotion,
        "confidence": confidence,
        "bands":      bands,
        "timestamp":  time.time(),
    }

@app.get("/api/eeg/waveform")
def eeg_waveform():
    """Returns 80 data points for each EEG band for waveform rendering."""
    t_base = time.time() * 2
    points = []
    for i in range(80):
        t = t_base + i * 0.1
        points.append({
            "alpha": round(50 + 20 * math.sin(t * 0.3)  + 4 * random.random(), 2),
            "beta":  round(50 + 15 * math.sin(t * 0.5 + 1) + 4 * random.random(), 2),
            "theta": round(50 + 18 * math.sin(t * 0.2 + 2) + 4 * random.random(), 2),
            "delta": round(50 + 22 * math.sin(t * 0.15+ 3) + 4 * random.random(), 2),
        })
    return {"points": points}

# -- Patients
@app.get("/api/patients")
def get_patients():
    return {"patients": PATIENTS}

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int):
    p = next((x for x in PATIENTS if x["id"] == patient_id), None)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@app.get("/api/patients/{patient_id}/notes")
def get_notes(patient_id: int):
    return {"notes": NOTES.get(patient_id, [])}

@app.post("/api/patients/notes")
def add_note(req: NoteRequest):
    if req.patient_id not in NOTES:
        NOTES[req.patient_id] = []
    NOTES[req.patient_id].append({"note": req.note, "time": time.strftime("%Y-%m-%d %H:%M")})
    return {"success": True, "notes": NOTES[req.patient_id]}

# -- Alerts
@app.get("/api/alerts")
def get_alerts():
    return {"alerts": ALERTS}

@app.post("/api/alerts/acknowledge")
def acknowledge_alert(req: AlertAckRequest):
    alert = next((a for a in ALERTS if a["id"] == req.alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["resolved"] = True
    return {"success": True, "alert_id": req.alert_id}

@app.post("/api/alerts/create")
def create_alert(alert: dict):
    new_id = max((a["id"] for a in ALERTS), default=0) + 1
    new_alert = {
        "id":       new_id,
        "patient":  alert.get("patient", "Unknown"),
        "emotion":  alert.get("emotion", "Stress"),
        "type":     alert.get("type", "warning"),
        "msg":      alert.get("msg", "Alert triggered"),
        "time":     "just now",
        "resolved": False,
    }
    ALERTS.insert(0, new_alert)
    return {"success": True, "alert": new_alert}

# -- Stats
@app.get("/api/stats")
def get_stats():
    active_alerts  = [a for a in ALERTS if not a["resolved"]]
    critical_count = len([a for a in active_alerts if a["type"] == "critical"])
    return {
        "active_patients":   len(PATIENTS),
        "critical_alerts":   critical_count,
        "active_alerts":     len(active_alerts),
    }