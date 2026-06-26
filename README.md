# 🧠 NeuroTrack — EEG-Based Emotion Recognition System

<div align="center">

![NeuroTrack](https://img.shields.io/badge/NeuroTrack-EEG%20Monitor-2563EB?style=for-the-badge&logo=activity&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![XGBoost](https://img.shields.io/badge/XGBoost-87.83%25-FF6600?style=for-the-badge&logo=python&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![HuggingFace](https://img.shields.io/badge/Backend-HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

**A real-time hospital monitoring platform that detects patient emotional states from EEG signals using machine learning — built for clinicians when verbal communication is not possible.**

[Live Demo](https://eeg-project-one.vercel.app) · [Backend API Docs](https://aakankshaa13-neurotrack-backend.hf.space/docs)

</div>

---

## 📌 Overview

NeuroTrack is a full-stack medical AI web application built as a **Final Year Project**. It uses the **GAMEEMO EEG dataset** (28 subjects, 14 channels, 128Hz) and a trained **XGBoost classifier (87.83% accuracy)** to recognize patient emotions in real time. The system streams pre-recorded EEG data through a real-time inference pipeline, simulating continuous hospital-grade patient monitoring across three user roles: **Doctor, Patient, and Admin**.

---

## ✨ Full Feature List

### 🔐 Authentication
- JWT-based login (HS256, 8-hour expiry)
- bcrypt password hashing
- Role-based access control — Doctor, Patient, Admin
- Protected routes per role
- Auto logout on token expiry

---

### 🩺 Doctor Dashboard

#### Overview / Dashboard Page
- Live summary cards — Total Patients, Active Alerts, Sessions Today, Accuracy
- Real-time emotion distribution across all patients
- Recent alert feed with quick acknowledge
- Patient status overview (normal / warning / critical)

#### Live Monitor Page
- Global monitoring toggle (Start / Stop)
- Real-time EEG waveform chart (Alpha, Beta, Theta, Delta band powers)
- Current emotion + confidence score display
- Session timer and session bar history
- Individual patient selector — click any patient to stream their specific EEG
- Emotion trend tracker (Rising / Stable / Falling)
- Classification count tracker

#### Patients Page
- Full patient list with live emotion badges
- Status indicators — normal (green), warning (amber), critical (red)
- Search and filter patients
- Click any patient to open their detail page

#### Patient Detail Page
- Full patient profile — name, age, condition, assigned doctor
- Live EEG band power chart for that specific patient
- Current emotion + confidence score
- Emotion history timeline
- Clinical treatment suggestions powered by NeuroAssist AI
- Add / view clinical notes
- PDF report generation (auth-protected, downloads directly)
- Live chat with patient

#### Alerts Page
- All active and resolved alerts
- Alert type — Stress, Pain, Sad, critical threshold breach
- One-click acknowledge
- Alert timestamp and patient name
- Auto-refresh every 8 seconds

#### Analytics Page
- Session bar chart — emotion distribution over time
- Band power trends
- Classification statistics

#### Settings Page
- Update doctor name and profile
- Dark mode toggle
- System preferences

---

### 🧑‍⚕️ Patient Portal

#### Home Tab
- Personal greeting and current emotional state
- Live EEG reading (updates every 3 seconds)
- Current emotion badge with confidence

#### My Health Tab
- EEG session history — all past sessions with timestamps
- Band power breakdown per session
- Emotion log over time

#### Messages Tab
- Secure real-time messaging with assigned doctor
- Message thread with timestamps
- Send and receive messages

---

### 🛡️ Admin Panel

#### Dashboard
- Total users, patients, doctors, admins count
- System health overview

#### User Management
- Create new users (Doctor / Patient / Admin)
- Edit existing user details
- Delete users
- Role assignment

#### Patient Management
- Add new patients
- Edit patient records (name, age, condition)
- Delete patients

#### Alert Rules
- Configure emotion thresholds that trigger alerts
- Enable / disable alert types

#### Audit Log
- Full log of every action taken in the system
- Actor, action, target, timestamp

#### System Statistics
- API call counts
- Active sessions
- Model accuracy display

---

### 🔔 Notification System
- Message toast popup — appears bottom-left when a patient sends a message
- Shows patient name and message preview, auto-dismisses after 5 seconds
- Unread message badge on Patients nav item with count
- Critical alert pulse banner at top of screen when a patient is in critical state
- Alert count badge on Alerts nav item

---

### 🤖 NeuroAssist AI
- Floating AI assistant button (bottom-right)
- Analyses live patient data and alerts
- Suggests clinical actions and treatment recommendations
- Context-aware responses based on current monitoring state

---

### ⌨️ Command Palette
- Press Ctrl+K to open
- Search patients, navigate pages, toggle monitoring from keyboard
- Fuzzy search across all patients and actions

---

## 🧠 EEG & ML Details

### Dataset — GAMEEMO
- 28 subjects played 4 video games designed to elicit different emotions
- Game 1 → Happy · Game 2 → Sad · Game 3 → Calm · Game 4 → Stress / Pain
- 14 EEG channels: AF3, AF4, F3, F4, F7, F8, FC5, FC6, O1, O2, P7, P8, T7, T8
- Sampling rate: 128 Hz

### Is It Real-Time?
The inference pipeline is genuinely real-time — the backend runs XGBoost classification on every API call every 3 seconds. The EEG source is the GAMEEMO pre-recorded dataset, which cycles continuously to simulate live streaming. In a real deployment, the CSV stream would be replaced with a live EEG headset feed — the rest of the pipeline remains identical.

### Feature Extraction

| Feature | Per Channel | Total (14 channels) |
|---------|-------------|----------------------|
| Mean | Yes | 14 |
| Std deviation | Yes | 14 |
| Variance | Yes | 14 |
| Delta power (0.5–4Hz) | Yes | 14 |
| Theta power (4–8Hz) | Yes | 14 |
| Alpha power (8–13Hz) | Yes | 14 |
| Beta power (13–30Hz) | Yes | 14 |
| Gamma power (30–45Hz) | Yes | 14 |
| **Total** | | **112 features** |

### Model
- Algorithm: XGBoost Classifier
- Window: 2-second sliding window, 50% overlap (256 samples @ 128Hz)
- Accuracy: **87.83%**
- Classes: Happy, Sad, Calm, Stress, Pain

### Patient → GAMEEMO Mapping

| Patient | Condition | EEG Source | Emotion |
|---------|-----------|------------|---------|
| Ahmed Raza | Post-surgery recovery | Subject 01, Game 3 | Calm |
| Fatima Malik | Anxiety disorder | Subject 02, Game 4 | Stress |
| Usman Khan | Chronic pain | Subject 03, Game 4 | Pain |
| Zara Hussain | Epilepsy monitoring | Subject 04, Game 1 | Happy |
| Ali Hassan | TBI recovery | Subject 05, Game 2 | Sad |

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python 3.10) |
| Database | SQLite with WAL mode |
| ML Model | XGBoost (87.83% accuracy) |
| Authentication | JWT HS256 + bcrypt |
| EEG Dataset | GAMEEMO |
| Frontend Deploy | Vercel |
| Backend Deploy | Hugging Face Spaces (Docker) |

---

## 🗂️ Project Structure

```
eeg-project/
├── backend/
│   ├── main.py                         # FastAPI — all API routes
│   ├── database.py                     # SQLite schema, seeding, queries
│   ├── eeg_engine.py                   # GAMEEMO loader + XGBoost inference
│   ├── model/
│   │   ├── xgboost_emotion_model.json  # Trained model (Git LFS)
│   │   └── scaler.pkl                  # Feature scaler (Git LFS)
│   ├── Dockerfile                      # HF Spaces deployment
│   ├── requirements.txt
│   └── neurotrack.db                   # SQLite database
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Doctor + Patient dashboards
│   │   ├── AdminApp.jsx                # Admin panel
│   │   ├── api.js                      # API client with JWT auth
│   │   └── index.css                   # Global styles + mobile responsive
│   └── public/
│       └── image.png                   # Login illustration
└── README.md
```

---

## 🚀 Local Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

App: `http://localhost:5173` · API docs: `http://localhost:8000/docs`

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor | dr.aakanksha@hospital.com | password |
| Patient | asra@hospital.com | password |
| Patient | fatima@hospital.com | password |
| Patient | usman@hospital.com | password |
| Admin | sanjana@hospital.com | admin123 |

---

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | No | Authenticate, returns JWT |
| GET | `/api/eeg/classify?patient_id=` | Yes | Real-time emotion classification |
| GET | `/api/eeg/waveform?patient_id=` | Yes | Live waveform band powers |
| GET | `/api/patients` | Yes | List all patients |
| GET | `/api/patients/{id}` | Yes | Single patient detail |
| GET | `/api/patients/{id}/report` | Yes | Download PDF report |
| GET | `/api/alerts` | Yes | Get all alerts |
| POST | `/api/alerts/acknowledge` | Yes | Acknowledge alert |
| GET | `/api/messages/{patient_id}` | Yes | Get messages |
| POST | `/api/messages` | Yes | Send message |
| GET | `/api/sessions` | Yes | EEG session history |
| GET | `/api/analytics` | Yes | Analytics data |
| GET | `/api/stats` | Yes | System statistics |
| GET | `/api/admin/*` | Admin only | All admin endpoints |

Full interactive docs: `https://aakankshaa13-neurotrack-backend.hf.space/docs`

---

## 👩‍💻 Developed By

**Aakanksha Pardeep** — Final Year Project, 2025–2026

---

## 📄 License

Academic use only. GAMEEMO dataset used under its original research license.
