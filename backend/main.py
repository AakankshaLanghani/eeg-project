from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import math, random, time
from jose import jwt, JWTError
from collections import defaultdict

import database as db
from eeg_engine import engine

# ─── JWT CONFIG ───────────────────────────────────────────────────────────────
SECRET_KEY = "neurotrack-secret-key-2024-eeg-hospital"
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 8

security = HTTPBearer(auto_error=False)

def create_token(email: str, role: str, name: str) -> str:
    payload = {
        "sub":  email,
        "role": role,
        "name": name,
        "exp":  time.time() + TOKEN_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ─── APP ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="NeuroTrack EEG API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise DB + load EEG engine on startup
db.init_db()
engine.load()

# ─── ALERT STATE (in-memory per patient) ─────────────────────────────────────
# Tracks consecutive stress/pain readings to auto-fire alerts
consecutive_counts = defaultdict(lambda: {"emotion": None, "count": 0})

def check_and_fire_alert(patient_id: int, emotion: str, patient_name: str):
    """Fire a DB alert if same negative emotion detected consecutively >= threshold."""
    settings  = db.settings_all()
    threshold = settings.get("alert_threshold", 3)

    state = consecutive_counts[patient_id]
    if emotion in ("Stress", "Pain", "Sad"):
        if state["emotion"] == emotion:
            state["count"] += 1
        else:
            state["emotion"] = emotion
            state["count"]   = 1

        if state["count"] == threshold:
            # Fire alert
            type_  = "critical" if emotion == "Pain" else "warning"
            msgs   = {
                "Stress": f"Elevated stress detected for {threshold} consecutive readings — review recommended",
                "Pain":   f"Persistent pain signals for {threshold}+ consecutive cycles",
                "Sad":    f"Prolonged sadness detected — clinical check suggested",
            }
            db.alert_create(patient=patient_name, emotion=emotion,
                            type_=type_, msg=msgs[emotion])
            db.patient_update(patient_id, {
                "status": "critical" if type_ == "critical" else "warning",
                "emotion": emotion,
            })
    else:
        # Positive emotion — reset counter
        if state["count"] > 0:
            # Auto-acknowledge if setting enabled
            if settings.get("auto_acknowledge"):
                alerts = db.alert_all()
                for a in alerts:
                    if a["patient"] == patient_name and not a["resolved"]:
                        db.alert_acknowledge(a["id"])
        state["emotion"] = emotion
        state["count"]   = 0
        # Update patient emotion + reset status if was warning/critical
        p = db.patient_get(patient_id)
        if p and p["status"] in ("warning", "critical"):
            db.patient_update(patient_id, {"emotion": emotion, "status": "normal"})
        elif p:
            db.patient_update(patient_id, {"emotion": emotion})

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
    sender_role: str
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
    start_time: str
    end_time: str
    days: str = "Mon,Tue,Wed,Thu,Fri"

class ScheduleUpdateRequest(BaseModel):
    label: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None
    enabled: Optional[bool] = None

# In-memory alert rules
ALERT_RULES = {
    "thresholds": {"Stress": 3, "Pain": 2, "Sad": 5, "Happy": 10, "Calm": 10},
    "auto_acknowledge": False,
}

UPLOADED_FILES = []

# ─── ROUTES ──────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "NeuroTrack EEG API", "version": "3.0.0", "engine_ready": engine.ready}

# ── Auth ─────────────────────────────────────────────────────────────────────
@app.post("/api/login")
def login(req: LoginRequest):
    user = db.user_get(req.email)
    if not user or not db.verify_password(req.password, user["password"]):
        db.audit_log(req.email, "login_failed", "bad credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    db.audit_log(req.email, "login", f"role:{user['role']}")

    patient_id = None
    if user["role"] == "Patient":
        patients = db.patient_all()
        match = next((p for p in patients if p["name"] == user["name"]), None)
        if match:
            patient_id = match["id"]

    token = create_token(req.email, user["role"], user["name"])
    return {
        "success":    True,
        "role":       user["role"],
        "name":       user["name"],
        "email":      req.email,
        "patient_id": patient_id,
        "token":      token,
    }

# ── EEG — Real data from GAMEEMO + XGBoost ───────────────────────────────────
@app.get("/api/eeg/classify")
def eeg_classify(patient_id: int = 1, _user=Depends(get_current_user)):
    reading = engine.next_reading(patient_id)

    # Update patient emotion in DB + check alert threshold
    patient = db.patient_get(patient_id)
    if patient:
        check_and_fire_alert(patient_id, reading["emotion"], patient["name"])

    return {
        "emotion":    reading["emotion"],
        "confidence": reading["confidence"],
        "bands":      reading["bands"],
        "timestamp":  time.time(),
        "source":     "gameemo_xgboost" if engine.ready else "simulated",
    }

@app.get("/api/eeg/waveform")
def eeg_waveform(patient_id: int = 1, _user=Depends(get_current_user)):
    points = engine.get_waveform_series(patient_id, n_points=80)
    return {"points": points}

# ── Patients ─────────────────────────────────────────────────────────────────
@app.get("/api/patients")
def get_patients(_user=Depends(get_current_user)):
    return {"patients": db.patient_all()}

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int, _user=Depends(get_current_user)):
    p = db.patient_get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@app.get("/api/patients/{patient_id}/notes")
def get_notes(patient_id: int, _user=Depends(get_current_user)):
    return {"notes": db.note_all(patient_id)}

@app.post("/api/patients/notes")
def add_note(req: NoteRequest, _user=Depends(get_current_user)):
    notes = db.note_add(req.patient_id, req.note)
    db.audit_log(_user["sub"], "note_added", f"patient_id:{req.patient_id}")
    return {"success": True, "notes": notes}

# ── Alerts ───────────────────────────────────────────────────────────────────
@app.get("/api/alerts")
def get_alerts(_user=Depends(get_current_user)):
    return {"alerts": db.alert_all()}

@app.post("/api/alerts/acknowledge")
def acknowledge_alert(req: AlertAckRequest, _user=Depends(get_current_user)):
    ok = db.alert_acknowledge(req.alert_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.audit_log(_user["sub"], "alert_acknowledged", f"alert_id:{req.alert_id}")
    return {"success": True, "alert_id": req.alert_id}

@app.post("/api/alerts/create")
async def create_alert(alert: dict, _user=Depends(get_current_user)):
    new_alert = db.alert_create(
        patient=alert.get("patient", "Unknown"),
        emotion=alert.get("emotion", "Stress"),
        type_=alert.get("type", "warning"),
        msg=alert.get("msg", "Alert triggered"),
    )
    return {"success": True, "alert": new_alert}

# ── Stats ────────────────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats(_user=Depends(get_current_user)):
    alerts   = db.alert_all()
    active   = [a for a in alerts if not a["resolved"]]
    critical = [a for a in active if a["type"] == "critical"]
    sessions = db.session_all()
    recordings_total = sum(len(db.session_recordings(s["id"])) for s in sessions)
    return {
        "active_patients":  len(db.patient_all()),
        "critical_alerts":  len(critical),
        "active_alerts":    len(active),
        "total_sessions":   len(sessions),
        "total_recordings": recordings_total,
    }

# ── Settings ─────────────────────────────────────────────────────────────────
@app.get("/api/settings")
def get_settings(_user=Depends(get_current_user)):
    return db.settings_all()

@app.post("/api/settings")
async def update_settings(payload: dict, _user=Depends(get_current_user)):
    db.settings_update(payload)
    if "doctor_name" in payload:
        users = db.user_all()
        for u in users:
            if u["role"] == "Doctor":
                db.user_update(u["email"], {"name": payload["doctor_name"]})
    db.audit_log(_user["sub"], "settings_updated", ", ".join(payload.keys()))
    return {"success": True, "settings": db.settings_all()}

# ── Upload ───────────────────────────────────────────────────────────────────
from fastapi import UploadFile, File

@app.post("/api/upload-data")
async def upload_data(file: UploadFile = File(...), _user=Depends(get_current_user)):
    content = await file.read()
    entry = {
        "id":          len(UPLOADED_FILES) + 1,
        "filename":    file.filename,
        "size_kb":     round(len(content) / 1024, 1),
        "type":        file.content_type or "application/octet-stream",
        "uploaded_at": time.strftime("%Y-%m-%d %H:%M"),
        "status":      "queued",
    }
    UPLOADED_FILES.append(entry)
    return {"success": True, "file": entry, "message": f"'{file.filename}' received and queued for training."}

@app.get("/api/upload-data")
def list_uploads(_user=Depends(get_current_user)):
    return {"files": UPLOADED_FILES}

# ── Analytics — real data from session recordings ────────────────────────────
@app.get("/api/analytics")
def get_analytics(_user=Depends(get_current_user)):
    sessions    = db.session_all()
    all_recs    = []
    for s in sessions:
        all_recs.extend(db.session_recordings(s["id"]))

    # Compute from real recordings if available, else use GAMEEMO-derived defaults
    if all_recs:
        emotion_counts = {"Happy": 0, "Calm": 0, "Sad": 0, "Stress": 0, "Pain": 0}
        total_conf     = 0.0
        for r in all_recs:
            em = r.get("emotion", "Calm")
            if em in emotion_counts:
                emotion_counts[em] += 1
            total_conf += r.get("confidence", 87.0)

        total = max(sum(emotion_counts.values()), 1)
        dist  = {k: round(v / total * 100) for k, v in emotion_counts.items()}
        avg_conf = round(total_conf / len(all_recs), 1) if all_recs else 87.76
    else:
        # GAMEEMO-derived defaults (from classifier_comparison.csv — XGBoost 87.76%)
        dist     = {"Happy": 25, "Calm": 25, "Sad": 25, "Stress": 13, "Pain": 12}
        avg_conf = 87.76

    return {
        "total_sessions":         len(sessions),
        "avg_confidence":         avg_conf,
        "total_classifications":  len(all_recs),
        "critical_events_today":  len([a for a in db.alert_all()
                                       if not a["resolved"] and a["type"] == "critical"]),
        "emotion_distribution":   dist,
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
        ],
    }

# ── Messaging ─────────────────────────────────────────────────────────────────
@app.get("/api/messages/{patient_id}")
def get_messages(patient_id: int, _user=Depends(get_current_user)):
    return {"messages": db.message_all(patient_id)}

@app.post("/api/messages")
def send_message(req: MessageRequest, _user=Depends(get_current_user)):
    msg = db.message_add(req.patient_id, req.sender_role, req.content)
    db.audit_log(_user["sub"], "message_sent", f"patient_id:{req.patient_id}")
    return {"success": True, "message": msg}

# ── EEG Sessions ─────────────────────────────────────────────────────────────
@app.get("/api/sessions")
def list_sessions(patient_id: int = None, _user=Depends(get_current_user)):
    return {"sessions": db.session_all(patient_id)}

@app.get("/api/sessions/{session_id}")
def get_session(session_id: int, _user=Depends(get_current_user)):
    s = db.session_get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s

@app.post("/api/sessions/start")
def start_session(req: SessionStartRequest, _user=Depends(get_current_user)):
    s = db.session_start(req.patient_id, req.label)
    db.audit_log(_user["sub"], "session_started", f"patient_id:{req.patient_id} label:{req.label}")
    return {"success": True, "session": s}

@app.post("/api/sessions/{session_id}/stop")
def stop_session(session_id: int, _user=Depends(get_current_user)):
    s = db.session_stop(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.audit_log(_user["sub"], "session_stopped", f"session_id:{session_id}")
    return {"success": True, "session": s}

@app.post("/api/sessions/record")
def add_recording(req: RecordingRequest, _user=Depends(get_current_user)):
    rec = db.session_add_recording(
        req.session_id, req.alpha, req.beta, req.theta, req.delta, req.emotion, req.confidence
    )
    return {"success": True, "recording": rec}

@app.get("/api/sessions/{session_id}/recordings")
def get_recordings(session_id: int, _user=Depends(get_current_user)):
    return {"recordings": db.session_recordings(session_id)}

# ── Schedules ─────────────────────────────────────────────────────────────────
@app.get("/api/schedules")
def list_schedules(doctor_email: str = None, _user=Depends(get_current_user)):
    return {"schedules": db.schedule_all(doctor_email)}

@app.post("/api/schedules")
def create_schedule(req: ScheduleRequest, _user=Depends(get_current_user)):
    s = db.schedule_create(req.patient_id, req.doctor_email, req.label,
                            req.start_time, req.end_time, req.days)
    db.audit_log(_user["sub"], "schedule_created", f"patient_id:{req.patient_id} {req.label}")
    return {"success": True, "schedule": s}

@app.put("/api/schedules/{schedule_id}")
def update_schedule(schedule_id: int, req: ScheduleUpdateRequest, _user=Depends(get_current_user)):
    fields = {k: v for k, v in req.dict().items() if v is not None}
    s = db.schedule_update(schedule_id, fields)
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"success": True, "schedule": s}

@app.delete("/api/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, _user=Depends(get_current_user)):
    ok = db.schedule_delete(schedule_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"success": True}

# ── Patient Report PDF ────────────────────────────────────────────────────────
@app.get("/api/patients/{patient_id}/report")
def patient_report(patient_id: int, _user=Depends(get_current_user)):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        import io
        from fastapi.responses import StreamingResponse

        patient  = db.patient_get(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        notes    = db.note_all(patient_id)
        sessions = db.session_all(patient_id)
        alerts   = [a for a in db.alert_all() if a["patient"] == patient["name"]]

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story  = []

        title_style = ParagraphStyle("title", parent=styles["Title"],
                                     fontSize=18, textColor=colors.HexColor("#6C3FF7"))
        info_style  = ParagraphStyle("info", parent=styles["Normal"], fontSize=11)

        story.append(Paragraph("NeuroTrack — Patient EEG Report", title_style))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(f"<b>Name:</b> {patient['name']}", info_style))
        story.append(Paragraph(f"<b>Age:</b> {patient['age']}", info_style))
        story.append(Paragraph(f"<b>Condition:</b> {patient['condition']}", info_style))
        story.append(Paragraph(f"<b>Current Emotion:</b> {patient['emotion']}", info_style))
        story.append(Paragraph(f"<b>Status:</b> {patient['status']}", info_style))
        story.append(Paragraph(f"<b>EEG Data Source:</b> GAMEEMO Dataset (XGBoost 87.76% accuracy)", info_style))
        story.append(Paragraph(f"<b>Report Generated:</b> {time.strftime('%Y-%m-%d %H:%M')}", info_style))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("<b>EEG Sessions</b>", styles["Heading2"]))
        if sessions:
            tdata = [["ID", "Label", "Started", "Duration"]]
            for s in sessions[:10]:
                dur = f"{s['duration_s']}s" if s.get("duration_s") else "ongoing"
                tdata.append([str(s["id"]), s["label"], s["start_time"], dur])
            t = Table(tdata, colWidths=[2*cm, 5*cm, 6*cm, 4*cm])
            t.setStyle(TableStyle([
                ("BACKGROUND",    (0,0), (-1,0), colors.HexColor("#6C3FF7")),
                ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
                ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS",(0,1), (-1,-1), [colors.white, colors.HexColor("#F3F0FF")]),
                ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
                ("FONTSIZE",      (0,0), (-1,-1), 9),
                ("PADDING",       (0,0), (-1,-1), 5),
            ]))
            story.append(t)
        else:
            story.append(Paragraph("No sessions recorded yet.", info_style))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("<b>Clinical Notes</b>", styles["Heading2"]))
        if notes:
            for n in notes[:10]:
                story.append(Paragraph(f"• [{n['time']}] {n['note']}", info_style))
        else:
            story.append(Paragraph("No notes recorded.", info_style))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("<b>Alert History</b>", styles["Heading2"]))
        if alerts:
            for a in alerts[:10]:
                status = "✓ Resolved" if a["resolved"] else "⚠ Active"
                story.append(Paragraph(
                    f"• [{a['type'].upper()}] {a['msg']} — {status}", info_style))
        else:
            story.append(Paragraph("No alerts recorded.", info_style))

        doc.build(story)
        buf.seek(0)
        filename = f"report_{patient['name'].replace(' ','_')}_{time.strftime('%Y%m%d')}.pdf"
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": f'attachment; filename="{filename}"'})
    except ImportError:
        raise HTTPException(status_code=503, detail="reportlab not installed.")

# ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────
@app.get("/api/admin/users")
def admin_get_users(_user=Depends(require_admin)):
    return {"users": db.user_all()}

@app.post("/api/admin/users")
def admin_create_user(req: CreateUserRequest, _user=Depends(require_admin)):
    if db.user_get(req.email):
        raise HTTPException(status_code=400, detail="User already exists")
    db.user_create(req.email, req.password, req.role, req.name)
    db.audit_log(_user["sub"], "user_created", req.email)
    return {"success": True}

@app.put("/api/admin/users/{email}")
def admin_update_user(email: str, req: UpdateUserRequest, _user=Depends(require_admin)):
    if not db.user_get(email):
        raise HTTPException(status_code=404, detail="User not found")
    fields = {k: v for k, v in req.dict().items() if v is not None}
    db.user_update(email, fields)
    db.audit_log(_user["sub"], "user_updated", email)
    return {"success": True}

@app.delete("/api/admin/users/{email}")
def admin_delete_user(email: str, _user=Depends(require_admin)):
    if not db.user_get(email):
        raise HTTPException(status_code=404, detail="User not found")
    db.user_delete(email)
    db.audit_log(_user["sub"], "user_deleted", email)
    return {"success": True}

@app.post("/api/admin/patients")
def admin_add_patient(req: AddPatientRequest, _user=Depends(require_admin)):
    p = db.patient_create(req.name, req.age, req.condition, req.initials,
                           req.color, req.tc, req.emotion, req.status)
    db.audit_log(_user["sub"], "patient_added", req.name)
    return {"success": True, "patient": p}

@app.put("/api/admin/patients/{patient_id}")
async def admin_update_patient(patient_id: int, data: dict, _user=Depends(require_admin)):
    p = db.patient_update(patient_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.audit_log(_user["sub"], "patient_updated", str(patient_id))
    return {"success": True, "patient": p}

@app.delete("/api/admin/patients/{patient_id}")
def admin_delete_patient(patient_id: int, _user=Depends(require_admin)):
    ok = db.patient_delete(patient_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.audit_log(_user["sub"], "patient_deleted", str(patient_id))
    return {"success": True}

@app.get("/api/admin/alert-rules")
def admin_get_alert_rules(_user=Depends(require_admin)):
    return ALERT_RULES

@app.post("/api/admin/alert-rules")
def admin_update_alert_rules(req: AlertRulesRequest, _user=Depends(require_admin)):
    ALERT_RULES["thresholds"]       = req.thresholds
    ALERT_RULES["auto_acknowledge"] = req.auto_acknowledge
    db.audit_log(_user["sub"], "alert_rules_updated", str(req.thresholds))
    return {"success": True, "rules": ALERT_RULES}

@app.get("/api/admin/audit-log")
def admin_get_audit_log(limit: int = 200, _user=Depends(require_admin)):
    return {"log": db.audit_all(limit)}

@app.get("/api/admin/stats")
def admin_get_stats(_user=Depends(require_admin)):
    users    = db.user_all()
    patients = db.patient_all()
    alerts   = db.alert_all()
    active   = [a for a in alerts if not a["resolved"]]
    return {
        "total_users":         len(users),
        "total_patients":      len(patients),
        "active_alerts":       len(active),
        "critical_alerts":     len([a for a in active if a["type"] == "critical"]),
        "total_doctors":       len([u for u in users if u["role"] == "Doctor"]),
        "total_patient_users": len([u for u in users if u["role"] == "Patient"]),
        "total_uploads":       len(UPLOADED_FILES),
        "audit_entries":       len(db.audit_all(500)),
        "engine_status":       "live_gameemo" if engine.ready else "simulated",
    }
