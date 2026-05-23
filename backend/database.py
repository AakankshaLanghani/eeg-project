"""
database.py — SQLite persistence layer for NeuroTrack EEG
Uses Python's built-in sqlite3 — no extra dependencies.
"""
import sqlite3, time, os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "neurotrack.db")

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# ─── SCHEMA ──────────────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    email     TEXT PRIMARY KEY,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL,
    name      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    age       INTEGER NOT NULL,
    condition TEXT NOT NULL,
    initials  TEXT,
    color     TEXT DEFAULT '#EDE9FE',
    tc        TEXT DEFAULT '#6C3FF7',
    emotion   TEXT DEFAULT 'Calm',
    status    TEXT DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    note       TEXT NOT NULL,
    time       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    patient  TEXT NOT NULL,
    emotion  TEXT NOT NULL,
    type     TEXT NOT NULL,
    msg      TEXT NOT NULL,
    time     TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id  INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL,
    content     TEXT NOT NULL,
    sent_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eeg_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id  INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    label       TEXT NOT NULL DEFAULT 'Session',
    start_time  TEXT NOT NULL,
    end_time    TEXT,
    duration_s  INTEGER
);

CREATE TABLE IF NOT EXISTS eeg_recordings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL REFERENCES eeg_sessions(id) ON DELETE CASCADE,
    ts          TEXT NOT NULL,
    alpha       REAL,
    beta        REAL,
    theta       REAL,
    delta       REAL,
    emotion     TEXT,
    confidence  REAL
);

CREATE TABLE IF NOT EXISTS schedules (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_email TEXT NOT NULL,
    label        TEXT NOT NULL,
    start_time   TEXT NOT NULL,
    end_time     TEXT NOT NULL,
    days         TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    enabled      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_log (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    actor  TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    time   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""

# ─── SEED DATA ───────────────────────────────────────────────────────────────
def _seed(conn):
    # Users
    conn.executemany(
        "INSERT OR IGNORE INTO users (email, password, role, name) VALUES (?,?,?,?)",
        [
            ("dr.johnson@hospital.com", "password", "Doctor",  "Dr. Ummelaila"),
            ("patient@hospital.com",    "password", "Patient", "Ahmed Raza"),
            ("admin@hospital.com",      "admin123", "Admin",   "System Admin"),
        ]
    )
    # Patients
    existing = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    if existing == 0:
        conn.executemany(
            "INSERT INTO patients (name, age, condition, initials, color, tc, emotion, status) VALUES (?,?,?,?,?,?,?,?)",
            [
                ("Ahmed Raza",   34, "Post-surgery",        "AR", "#EDE9FE", "#6C3FF7", "Calm",   "normal"),
                ("Fatima Malik", 28, "Anxiety disorder",    "FM", "#DCFCE7", "#16A34A", "Stress", "warning"),
                ("Usman Khan",   52, "Chronic pain",        "UK", "#FEE2E2", "#DC2626", "Pain",   "critical"),
                ("Zara Hussain", 19, "Epilepsy monitoring", "ZH", "#EDE9FE", "#6C3FF7", "Happy",  "normal"),
                ("Ali Hassan",   45, "TBI recovery",        "AH", "#DCFCE7", "#16A34A", "Sad",    "warning"),
            ]
        )
    # Alerts
    al_existing = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    if al_existing == 0:
        conn.executemany(
            "INSERT INTO alerts (patient, emotion, type, msg, time, resolved) VALUES (?,?,?,?,?,?)",
            [
                ("Usman Khan",   "Pain",   "critical", "Persistent pain signals for 5+ consecutive cycles",     "2 min ago",  0),
                ("Fatima Malik", "Stress", "warning",  "Elevated stress detected — clinical review recommended", "8 min ago",  0),
                ("Ali Hassan",   "Stress", "warning",  "Stress signal rising above detection threshold",         "15 min ago", 0),
            ]
        )
    # Default settings
    defaults = {
        "doctor_name":     "Dr. Ummelaila",
        "specialty":       "Neurologist",
        "email":           "dr.johnson@hospital.com",
        "alert_threshold": "3",
        "auto_acknowledge":"false",
        "notifications":   "true",
        "dark_mode":       "false",
    }
    for k, v in defaults.items():
        conn.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)", (k, v))
    # Seed some messages
    msg_existing = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    if msg_existing == 0:
        conn.executemany(
            "INSERT INTO messages (patient_id, sender_role, content, sent_at) VALUES (?,?,?,?)",
            [
                (1, "Doctor",  "Hello Ahmed, how are you feeling today?",            "2025-05-22 09:00"),
                (1, "Patient", "I feel a bit tired but overall okay, thank you.",    "2025-05-22 09:02"),
                (1, "Doctor",  "Good. Please let me know if your headaches return.", "2025-05-22 09:03"),
                (2, "Doctor",  "Fatima, your stress levels have been elevated. Please try the breathing exercises.", "2025-05-22 10:15"),
                (2, "Patient", "Yes doctor, I will try them after lunch.",            "2025-05-22 10:20"),
            ]
        )


def init_db():
    """Create tables and seed initial data. Safe to call on every startup."""
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        _seed(conn)


# ─── USERS ───────────────────────────────────────────────────────────────────
def user_get(email: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        return dict(row) if row else None

def user_all():
    with get_conn() as conn:
        rows = conn.execute("SELECT email, name, role FROM users ORDER BY role, name").fetchall()
        return [dict(r) for r in rows]

def user_create(email, password, role, name):
    with get_conn() as conn:
        conn.execute("INSERT INTO users (email, password, role, name) VALUES (?,?,?,?)",
                     (email, password, role, name))

def user_update(email, fields: dict):
    allowed = {"name", "password", "role"}
    sets = [f"{k}=?" for k in fields if k in allowed]
    vals = [v for k, v in fields.items() if k in allowed]
    if not sets:
        return
    with get_conn() as conn:
        conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE email=?", vals + [email])

def user_delete(email: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM users WHERE email=?", (email,))


# ─── PATIENTS ────────────────────────────────────────────────────────────────
def patient_all():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM patients ORDER BY id").fetchall()
        return [dict(r) for r in rows]

def patient_get(patient_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id=?", (patient_id,)).fetchone()
        return dict(row) if row else None

def patient_create(name, age, condition, initials="", color="#EDE9FE", tc="#6C3FF7", emotion="Calm", status="normal"):
    ini = initials or "".join(w[0].upper() for w in name.split()[:2])
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO patients (name, age, condition, initials, color, tc, emotion, status) VALUES (?,?,?,?,?,?,?,?)",
            (name, age, condition, ini, color, tc, emotion, status)
        )
        return patient_get(cur.lastrowid)

def patient_update(patient_id: int, fields: dict):
    allowed = {"name", "age", "condition", "initials", "color", "tc", "emotion", "status"}
    sets = [f"{k}=?" for k in fields if k in allowed]
    vals = [v for k, v in fields.items() if k in allowed]
    if not sets:
        return
    with get_conn() as conn:
        conn.execute(f"UPDATE patients SET {', '.join(sets)} WHERE id=?", vals + [patient_id])
    return patient_get(patient_id)

def patient_delete(patient_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM patients WHERE id=?", (patient_id,))
        return cur.rowcount > 0


# ─── NOTES ───────────────────────────────────────────────────────────────────
def note_all(patient_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM notes WHERE patient_id=? ORDER BY id DESC", (patient_id,)
        ).fetchall()
        return [dict(r) for r in rows]

def note_add(patient_id: int, note: str):
    ts = time.strftime("%Y-%m-%d %H:%M")
    with get_conn() as conn:
        conn.execute("INSERT INTO notes (patient_id, note, time) VALUES (?,?,?)", (patient_id, note, ts))
    return note_all(patient_id)


# ─── ALERTS ──────────────────────────────────────────────────────────────────
def alert_all():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM alerts ORDER BY id DESC").fetchall()
        return [_alert_row(r) for r in rows]

def alert_create(patient, emotion, type_, msg):
    ts = time.strftime("%Y-%m-%d %H:%M")
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO alerts (patient, emotion, type, msg, time, resolved) VALUES (?,?,?,?,?,0)",
            (patient, emotion, type_, msg, ts)
        )
        row = conn.execute("SELECT * FROM alerts WHERE id=?", (cur.lastrowid,)).fetchone()
        return _alert_row(row)

def alert_acknowledge(alert_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute("UPDATE alerts SET resolved=1 WHERE id=?", (alert_id,))
        return cur.rowcount > 0

def _alert_row(r):
    d = dict(r)
    d["resolved"] = bool(d["resolved"])
    return d


# ─── MESSAGES ────────────────────────────────────────────────────────────────
def message_all(patient_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE patient_id=? ORDER BY id ASC", (patient_id,)
        ).fetchall()
        return [dict(r) for r in rows]

def message_add(patient_id: int, sender_role: str, content: str):
    ts = time.strftime("%Y-%m-%d %H:%M")
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO messages (patient_id, sender_role, content, sent_at) VALUES (?,?,?,?)",
            (patient_id, sender_role, content, ts)
        )
        row = conn.execute("SELECT * FROM messages WHERE id=?", (cur.lastrowid,)).fetchone()
        return dict(row)


# ─── EEG SESSIONS ────────────────────────────────────────────────────────────
def session_all(patient_id: int = None):
    with get_conn() as conn:
        if patient_id:
            rows = conn.execute(
                "SELECT * FROM eeg_sessions WHERE patient_id=? ORDER BY id DESC", (patient_id,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM eeg_sessions ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]

def session_get(session_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM eeg_sessions WHERE id=?", (session_id,)).fetchone()
        return dict(row) if row else None

def session_start(patient_id: int, label: str = "Session"):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO eeg_sessions (patient_id, label, start_time) VALUES (?,?,?)",
            (patient_id, label, ts)
        )
        return session_get(cur.lastrowid)

def session_stop(session_id: int):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        # compute duration from start_time
        row = conn.execute("SELECT start_time FROM eeg_sessions WHERE id=?", (session_id,)).fetchone()
        duration = None
        if row:
            try:
                import datetime
                start = datetime.datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S")
                end   = datetime.datetime.strptime(ts,      "%Y-%m-%d %H:%M:%S")
                duration = int((end - start).total_seconds())
            except Exception:
                pass
        conn.execute(
            "UPDATE eeg_sessions SET end_time=?, duration_s=? WHERE id=?",
            (ts, duration, session_id)
        )
    return session_get(session_id)

def session_add_recording(session_id: int, alpha, beta, theta, delta, emotion, confidence):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO eeg_recordings (session_id, ts, alpha, beta, theta, delta, emotion, confidence) VALUES (?,?,?,?,?,?,?,?)",
            (session_id, ts, alpha, beta, theta, delta, emotion, confidence)
        )
        row = conn.execute("SELECT * FROM eeg_recordings WHERE id=?", (cur.lastrowid,)).fetchone()
        return dict(row)

def session_recordings(session_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM eeg_recordings WHERE session_id=? ORDER BY id ASC", (session_id,)
        ).fetchall()
        return [dict(r) for r in rows]


# ─── SCHEDULES ───────────────────────────────────────────────────────────────
def schedule_all(doctor_email: str = None):
    with get_conn() as conn:
        if doctor_email:
            rows = conn.execute(
                "SELECT s.*, p.name as patient_name FROM schedules s JOIN patients p ON p.id=s.patient_id WHERE s.doctor_email=? ORDER BY s.id",
                (doctor_email,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT s.*, p.name as patient_name FROM schedules s JOIN patients p ON p.id=s.patient_id ORDER BY s.id"
            ).fetchall()
        return [_sched_row(r) for r in rows]

def schedule_get(schedule_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT s.*, p.name as patient_name FROM schedules s JOIN patients p ON p.id=s.patient_id WHERE s.id=?",
            (schedule_id,)
        ).fetchone()
        return _sched_row(row) if row else None

def schedule_create(patient_id, doctor_email, label, start_time, end_time, days="Mon,Tue,Wed,Thu,Fri"):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO schedules (patient_id, doctor_email, label, start_time, end_time, days, enabled) VALUES (?,?,?,?,?,?,1)",
            (patient_id, doctor_email, label, start_time, end_time, days)
        )
        return schedule_get(cur.lastrowid)

def schedule_update(schedule_id: int, fields: dict):
    allowed = {"label", "start_time", "end_time", "days", "enabled", "patient_id"}
    sets = [f"{k}=?" for k in fields if k in allowed]
    vals = [v for k, v in fields.items() if k in allowed]
    if not sets:
        return
    with get_conn() as conn:
        conn.execute(f"UPDATE schedules SET {', '.join(sets)} WHERE id=?", vals + [schedule_id])
    return schedule_get(schedule_id)

def schedule_delete(schedule_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM schedules WHERE id=?", (schedule_id,))
        return cur.rowcount > 0

def _sched_row(r):
    d = dict(r)
    d["enabled"] = bool(d.get("enabled", 1))
    return d


# ─── SETTINGS ────────────────────────────────────────────────────────────────
def settings_all():
    with get_conn() as conn:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
        raw = {r["key"]: r["value"] for r in rows}
    return {
        "doctor_name":     raw.get("doctor_name", "Dr. Ummelaila"),
        "specialty":       raw.get("specialty", "Neurologist"),
        "email":           raw.get("email", ""),
        "alert_threshold": int(raw.get("alert_threshold", "3")),
        "auto_acknowledge": raw.get("auto_acknowledge", "false") == "true",
        "notifications":   raw.get("notifications", "true") == "true",
        "dark_mode":       raw.get("dark_mode", "false") == "true",
    }

def settings_update(data: dict):
    with get_conn() as conn:
        for k, v in data.items():
            if isinstance(v, bool):
                v = "true" if v else "false"
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)", (k, str(v)))


# ─── AUDIT LOG ───────────────────────────────────────────────────────────────
def audit_log(actor: str, action: str, target: str = ""):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO audit_log (actor, action, target, time) VALUES (?,?,?,?)",
            (actor, action, target, ts)
        )

def audit_all(limit: int = 200):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
