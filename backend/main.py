from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import math, random, time

import database as db

app = FastAPI(title="NeuroTrack EEG API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise DB on startup (creates tables + seeds data if first run)
db.init_db()

# ─── EEG HELPERS (stateless) ─────────────────────────────────────────────────
eeg_t = 0

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
    if r < 0.4 and beta > 0.6:          return "Pain"
    if r < 0.6 and beta > 0.45:         return "Stress"
    if alpha > 0.55 and beta < 0.35:    return "Calm"
    if theta > 0.55 and delta > 0.55:   return "Sad"
    return random.choice(["Happy", "Happy", "Happy", "Calm"])

# ─── SCHEMAS ─────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class NoteRequest(BaseModel):
    patient_id: int
    note: str

class AlertAckRequest(BaseModel):
    alert_id: int

class CreateUserRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class AddPatientRequest(BaseModel):
    name: str
    age: int
    condition: str
    initials: str = ""
    color: str = "#EDE9FE"
    tc: str = "#6C3FF7"
    emotion: str = "Calm"
    status: str = "normal"

class AlertRulesRequest(BaseModel):
    thresholds: dict
    auto_acknowledge: bool = False

class MessageRequest(BaseModel):
    patient_id: int
    sender_role: str  # "Doctor" | "Patient"
    content: str

class SessionStartRequest(BaseModel):
    patient_id: int
    label: str = "Session"

class RecordingRequest(BaseModel):
    session_id: int
    alpha: float
    beta: float
    theta: float
    delta: float
    emotion: str
    confidence: float

class ScheduleRequest(BaseModel):
    patient_id: int
    doctor_email: str
    label: str
    start_time: str  # "08:00"
    end_time: str    # "09:00"
    days: str = "Mon,Tue,Wed,Thu,Fri"

class ScheduleUpdateRequest(BaseModel):
    label: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None
    enabled: Optional[bool] = None

# In-memory store for alert rules (not critical to persist)
ALERT_RULES = {
    "thresholds": {"Stress": 3, "Pain": 2, "Sad": 5, "Happy": 10, "Calm": 10},
    "auto_acknowledge": False,
}

# In-memory uploaded files log (ephemeral by design)
UPLOADED_FILES = []

# ─── ROUTES ──────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "NeuroTrack EEG API is running", "version": "2.0.0"}

# ── Auth ─────────────────────────────────────────────────────────────────────
@app.post("/api/login")
def login(req: LoginRequest):
    user = db.user_get(req.email)
    if not user or user["password"] != req.password:
        db.audit_log(req.email, "login_failed", "bad credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    db.audit_log(req.email, "login", f"role:{user['role']}")
    # For Patient role, also return patient_id by matching name
    patient_id = None
    if user["role"] == "Patient":
        patients = db.patient_all()
        match = next((p for p in patients if p["name"] == user["name"]), None)
        if match:
            patient_id = match["id"]
    return {
        "success": True,
        "role": user["role"],
        "name": user["name"],
        "email": req.email,
        "patient_id": patient_id,
    }

# ── EEG ──────────────────────────────────────────────────────────────────────
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
    t_base = time.time() * 2
    points = []
    for i in range(80):
        t = t_base + i * 0.1
        points.append({
            "alpha": round(50 + 20 * math.sin(t * 0.3)     + 4 * random.random(), 2),
            "beta":  round(50 + 15 * math.sin(t * 0.5 + 1) + 4 * random.random(), 2),
            "theta": round(50 + 18 * math.sin(t * 0.2 + 2) + 4 * random.random(), 2),
            "delta": round(50 + 22 * math.sin(t * 0.15+ 3) + 4 * random.random(), 2),
        })
    return {"points": points}

# ── Patients ─────────────────────────────────────────────────────────────────
@app.get("/api/patients")
def get_patients():
    return {"patients": db.patient_all()}

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int):
    p = db.patient_get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@app.get("/api/patients/{patient_id}/notes")
def get_notes(patient_id: int):
    return {"notes": db.note_all(patient_id)}

@app.post("/api/patients/notes")
def add_note(req: NoteRequest):
    notes = db.note_add(req.patient_id, req.note)
    db.audit_log("doctor", "note_added", f"patient_id:{req.patient_id}")
    return {"success": True, "notes": notes}

# ── Alerts ───────────────────────────────────────────────────────────────────
@app.get("/api/alerts")
def get_alerts():
    return {"alerts": db.alert_all()}

@app.post("/api/alerts/acknowledge")
def acknowledge_alert(req: AlertAckRequest):
    ok = db.alert_acknowledge(req.alert_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.audit_log("doctor", "alert_acknowledged", f"alert_id:{req.alert_id}")
    return {"success": True, "alert_id": req.alert_id}

@app.post("/api/alerts/create")
async def create_alert(alert: dict):
    new_alert = db.alert_create(
        patient=alert.get("patient", "Unknown"),
        emotion=alert.get("emotion", "Stress"),
        type_=alert.get("type", "warning"),
        msg=alert.get("msg", "Alert triggered"),
    )
    return {"success": True, "alert": new_alert}

# ── Stats ────────────────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats():
    alerts = db.alert_all()
    active = [a for a in alerts if not a["resolved"]]
    critical = [a for a in active if a["type"] == "critical"]
    return {
        "active_patients": len(db.patient_all()),
        "critical_alerts": len(critical),
        "active_alerts":   len(active),
    }

# ── Settings ─────────────────────────────────────────────────────────────────
@app.get("/api/settings")
def get_settings():
    return db.settings_all()

@app.post("/api/settings")
async def update_settings(payload: dict):
    db.settings_update(payload)
    # Keep doctor name in sync across users table
    if "doctor_name" in payload:
        users = db.user_all()
        for u in users:
            if u["role"] == "Doctor":
                db.user_update(u["email"], {"name": payload["doctor_name"]})
    db.audit_log("doctor", "settings_updated", ", ".join(payload.keys()))
    return {"success": True, "settings": db.settings_all()}

# ── Upload ───────────────────────────────────────────────────────────────────
from fastapi import UploadFile, File

@app.post("/api/upload-data")
async def upload_data(file: UploadFile = File(...)):
    content = await file.read()
    entry = {
        "id": len(UPLOADED_FILES) + 1,
        "filename": file.filename,
        "size_kb": round(len(content) / 1024, 1),
        "type": file.content_type or "application/octet-stream",
        "uploaded_at": time.strftime("%Y-%m-%d %H:%M"),
        "status": "queued",
    }
    UPLOADED_FILES.append(entry)
    return {"success": True, "file": entry, "message": f"'{file.filename}' received and queued for training."}

@app.get("/api/upload-data")
def list_uploads():
    return {"files": UPLOADED_FILES}

# ── Analytics ────────────────────────────────────────────────────────────────
@app.get("/api/analytics")
def get_analytics():
    return {
        "total_sessions": 47,
        "avg_confidence": 88.3,
        "total_classifications": 1420,
        "critical_events_today": 3,
        "emotion_distribution": {
            "Happy": 18, "Calm": 32, "Sad": 9, "Stress": 27, "Pain": 14
        },
        "hourly_stress": [
            {"hour": "8AM",  "level": 22},
            {"hour": "9AM",  "level": 35},
            {"hour": "10AM", "level": 28},
            {"hour": "11AM", "level": 55},
            {"hour": "12PM", "level": 40},
            {"hour": "1PM",  "level": 62},
            {"hour": "2PM",  "level": 48},
            {"hour": "3PM",  "level": 33},
            {"hour": "4PM",  "level": 25},
        ]
    }

# ─── MESSAGING ────────────────────────────────────────────────────────────────
@app.get("/api/messages/{patient_id}")
def get_messages(patient_id: int):
    return {"messages": db.message_all(patient_id)}

@app.post("/api/messages")
def send_message(req: MessageRequest):
    msg = db.message_add(req.patient_id, req.sender_role, req.content)
    db.audit_log(req.sender_role.lower(), "message_sent", f"patient_id:{req.patient_id}")
    return {"success": True, "message": msg}

# ─── EEG SESSIONS & RECORDING ────────────────────────────────────────────────
@app.get("/api/sessions")
def list_sessions(patient_id: int = None):
    return {"sessions": db.session_all(patient_id)}

@app.get("/api/sessions/{session_id}")
def get_session(session_id: int):
    s = db.session_get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s

@app.post("/api/sessions/start")
def start_session(req: SessionStartRequest):
    s = db.session_start(req.patient_id, req.label)
    db.audit_log("doctor", "session_started", f"patient_id:{req.patient_id} label:{req.label}")
    return {"success": True, "session": s}

@app.post("/api/sessions/{session_id}/stop")
def stop_session(session_id: int):
    s = db.session_stop(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.audit_log("doctor", "session_stopped", f"session_id:{session_id}")
    return {"success": True, "session": s}

@app.post("/api/sessions/record")
def add_recording(req: RecordingRequest):
    rec = db.session_add_recording(
        req.session_id, req.alpha, req.beta, req.theta, req.delta, req.emotion, req.confidence
    )
    return {"success": True, "recording": rec}

@app.get("/api/sessions/{session_id}/recordings")
def get_recordings(session_id: int):
    return {"recordings": db.session_recordings(session_id)}

# ─── SCHEDULES ────────────────────────────────────────────────────────────────
@app.get("/api/schedules")
def list_schedules(doctor_email: str = None):
    return {"schedules": db.schedule_all(doctor_email)}

@app.post("/api/schedules")
def create_schedule(req: ScheduleRequest):
    s = db.schedule_create(req.patient_id, req.doctor_email, req.label, req.start_time, req.end_time, req.days)
    db.audit_log(req.doctor_email, "schedule_created", f"patient_id:{req.patient_id} {req.label}")
    return {"success": True, "schedule": s}

@app.put("/api/schedules/{schedule_id}")
def update_schedule(schedule_id: int, req: ScheduleUpdateRequest):
    fields = {k: v for k, v in req.dict().items() if v is not None}
    s = db.schedule_update(schedule_id, fields)
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"success": True, "schedule": s}

@app.delete("/api/schedules/{schedule_id}")
def delete_schedule(schedule_id: int):
    ok = db.schedule_delete(schedule_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"success": True}

# ─── PATIENT REPORTS ─────────────────────────────────────────────────────────
@app.get("/api/patients/{patient_id}/report")
def patient_report(patient_id: int):
    """Generate a PDF report for a patient using reportlab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        import io
        from fastapi.responses import StreamingResponse

        patient = db.patient_get(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        notes = db.note_all(patient_id)
        sessions = db.session_all(patient_id)
        alerts = [a for a in db.alert_all() if a["patient"] == patient["name"]]

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle("title", parent=styles["Title"], fontSize=18, textColor=colors.HexColor("#6C3FF7"))
        story.append(Paragraph("NeuroTrack — Patient Report", title_style))
        story.append(Spacer(1, 0.3*cm))

        # Patient info
        info_style = ParagraphStyle("info", parent=styles["Normal"], fontSize=11)
        story.append(Paragraph(f"<b>Name:</b> {patient['name']}", info_style))
        story.append(Paragraph(f"<b>Age:</b> {patient['age']}", info_style))
        story.append(Paragraph(f"<b>Condition:</b> {patient['condition']}", info_style))
        story.append(Paragraph(f"<b>Current Emotion:</b> {patient['emotion']}", info_style))
        story.append(Paragraph(f"<b>Status:</b> {patient['status']}", info_style))
        story.append(Paragraph(f"<b>Report Generated:</b> {time.strftime('%Y-%m-%d %H:%M')}", info_style))
        story.append(Spacer(1, 0.5*cm))

        # Sessions summary
        story.append(Paragraph("<b>EEG Sessions</b>", styles["Heading2"]))
        if sessions:
            tdata = [["ID", "Label", "Started", "Duration"]]
            for s in sessions[:10]:
                dur = f"{s['duration_s']}s" if s.get('duration_s') else "ongoing"
                tdata.append([str(s["id"]), s["label"], s["start_time"], dur])
            t = Table(tdata, colWidths=[2*cm, 5*cm, 6*cm, 4*cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#6C3FF7")),
                ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
                ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F3F0FF")]),
                ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
                ("FONTSIZE",   (0,0), (-1,-1), 9),
                ("PADDING",    (0,0), (-1,-1), 5),
            ]))
            story.append(t)
        else:
            story.append(Paragraph("No sessions recorded yet.", info_style))
        story.append(Spacer(1, 0.5*cm))

        # Clinical notes
        story.append(Paragraph("<b>Clinical Notes</b>", styles["Heading2"]))
        if notes:
            for n in notes[:10]:
                story.append(Paragraph(f"• [{n['time']}] {n['note']}", info_style))
        else:
            story.append(Paragraph("No notes recorded.", info_style))
        story.append(Spacer(1, 0.5*cm))

        # Alerts
        story.append(Paragraph("<b>Alert History</b>", styles["Heading2"]))
        if alerts:
            for a in alerts[:10]:
                status = "✓ Resolved" if a["resolved"] else "⚠ Active"
                story.append(Paragraph(f"• [{a['type'].upper()}] {a['msg']} — {status}", info_style))
        else:
            story.append(Paragraph("No alerts recorded.", info_style))

        doc.build(story)
        buf.seek(0)
        filename = f"report_{patient['name'].replace(' ','_')}_{time.strftime('%Y%m%d')}.pdf"
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": f'attachment; filename="{filename}"'})
    except ImportError:
        raise HTTPException(status_code=503, detail="reportlab not installed. Run: pip install reportlab")

# ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

# ── User management ──
@app.get("/api/admin/users")
def admin_get_users():
    return {"users": db.user_all()}

@app.post("/api/admin/users")
def admin_create_user(req: CreateUserRequest):
    if db.user_get(req.email):
        raise HTTPException(status_code=400, detail="User already exists")
    db.user_create(req.email, req.password, req.role, req.name)
    db.audit_log("admin", "user_created", req.email)
    return {"success": True}

@app.put("/api/admin/users/{email}")
def admin_update_user(email: str, req: UpdateUserRequest):
    if not db.user_get(email):
        raise HTTPException(status_code=404, detail="User not found")
    fields = {k: v for k, v in req.dict().items() if v is not None}
    db.user_update(email, fields)
    db.audit_log("admin", "user_updated", email)
    return {"success": True}

@app.delete("/api/admin/users/{email}")
def admin_delete_user(email: str):
    if not db.user_get(email):
        raise HTTPException(status_code=404, detail="User not found")
    db.user_delete(email)
    db.audit_log("admin", "user_deleted", email)
    return {"success": True}

# ── Patient management ──
@app.post("/api/admin/patients")
def admin_add_patient(req: AddPatientRequest):
    p = db.patient_create(req.name, req.age, req.condition, req.initials, req.color, req.tc, req.emotion, req.status)
    db.audit_log("admin", "patient_added", req.name)
    return {"success": True, "patient": p}

@app.put("/api/admin/patients/{patient_id}")
async def admin_update_patient(patient_id: int, data: dict):
    p = db.patient_update(patient_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.audit_log("admin", "patient_updated", str(patient_id))
    return {"success": True, "patient": p}

@app.delete("/api/admin/patients/{patient_id}")
def admin_delete_patient(patient_id: int):
    ok = db.patient_delete(patient_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.audit_log("admin", "patient_deleted", str(patient_id))
    return {"success": True}

# ── Alert rules ──
@app.get("/api/admin/alert-rules")
def admin_get_alert_rules():
    return ALERT_RULES

@app.post("/api/admin/alert-rules")
def admin_update_alert_rules(req: AlertRulesRequest):
    ALERT_RULES["thresholds"] = req.thresholds
    ALERT_RULES["auto_acknowledge"] = req.auto_acknowledge
    db.audit_log("admin", "alert_rules_updated", str(req.thresholds))
    return {"success": True, "rules": ALERT_RULES}

# ── Audit log ──
@app.get("/api/admin/audit-log")
def admin_get_audit_log(limit: int = 200):
    return {"log": db.audit_all(limit)}

# ── System stats ──
@app.get("/api/admin/stats")
def admin_get_stats():
    users = db.user_all()
    patients = db.patient_all()
    alerts = db.alert_all()
    active_alerts = [a for a in alerts if not a["resolved"]]
    return {
        "total_users":        len(users),
        "total_patients":     len(patients),
        "active_alerts":      len(active_alerts),
        "critical_alerts":    len([a for a in active_alerts if a["type"] == "critical"]),
        "total_doctors":      len([u for u in users if u["role"] == "Doctor"]),
        "total_patient_users":len([u for u in users if u["role"] == "Patient"]),
        "total_uploads":      len(UPLOADED_FILES),
        "audit_entries":      len(db.audit_all(500)),
    }
