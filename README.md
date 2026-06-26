# 🧠 NeuroTrack — EEG-Based Emotion Recognition System

> A real-time hospital monitoring platform that uses EEG signals and machine learning to detect patient emotional states (Happy, Sad, Calm, Stress, Pain) when verbal communication is not possible.

---

## 📌 Overview

NeuroTrack is a full-stack medical AI web application built as a Final Year Project. It streams real EEG data from the **GAMEEMO dataset**, classifies emotions using a trained **XGBoost model (87.83% accuracy)**, and presents results through a clean clinical dashboard for Doctors, Patients, and Admins.

---

## ✨ Features

### 🩺 Doctor Dashboard
- Live EEG waveform monitoring per patient
- Real-time emotion classification with confidence scores
- Patient detail pages with band power charts (Alpha, Beta, Theta, Delta)
- Clinical notes and treatment suggestions via NeuroAssist AI
- Alert management and patient scheduling
- PDF report generation per patient
- Messaging system with patients

### 🧑‍⚕️ Patient Portal
- View personal EEG readings and emotion history
- EEG session history
- Secure messaging with assigned doctor
- Personal profile and settings

### 🛡️ Admin Panel
- User management (Doctors, Patients, Admins)
- Patient record management
- Alert rules configuration
- Full audit log
- System statistics

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python) |
| Database | SQLite (WAL mode) |
| ML Model | XGBoost (87.83% accuracy) |
| Auth | JWT (HS256, 8h expiry) + bcrypt |
| EEG Dataset | GAMEEMO (28 subjects, 14 channels, 128Hz) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

---

## 🧠 EEG & ML Details

- **Dataset**: GAMEEMO — 28 subjects × 4 games (Happy, Sad, Calm, Stress)
- **Channels**: 14 EEG channels (AF3, AF4, F3, F4, F7, F8, FC5, FC6, O1, O2, P7, P8, T7, T8)
- **Features**: 112 per window (14 channels × 8: mean, std, variance + 5 band powers)
- **Band Powers**: Delta (0.5–4Hz), Theta (4–8Hz), Alpha (8–13Hz), Beta (13–30Hz), Gamma (30–45Hz)
- **Window**: 2-second sliding window, 50% overlap
- **Model**: XGBoost classifier — **87.83% test accuracy**
- **Inference**: Real-time per-patient classification every 3 seconds

### Patient → GAMEEMO Mapping

| Patient | Condition | EEG Source | Emotion |
|---------|-----------|------------|---------|
| Ahmed Raza | Post-surgery recovery | S01 Game 3 | Calm |
| Fatima Malik | Anxiety disorder | S02 Game 4 | Stress |
| Usman Khan | Chronic pain | S03 Game 4 | Pain |
| Zara Hussain | Epilepsy monitoring | S04 Game 1 | Happy |
| Ali Hassan | TBI recovery | S05 Game 2 | Sad |

---

## 🗂️ Project Structure

```
eeg-project/
├── backend/
│   ├── main.py              # FastAPI app, all API routes
│   ├── database.py          # SQLite schema, seed data, queries
│   ├── eeg_engine.py        # EEG data loader + XGBoost inference
│   ├── model/
│   │   ├── xgboost_emotion_model.json
│   │   └── scaler.pkl
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app — Doctor + Patient dashboards
│   │   ├── AdminApp.jsx     # Admin panel
│   │   └── api.js           # API client with JWT auth
│   └── public/
│       └── image.png        # Login page illustration
└── GAMEEMO/                 # EEG dataset (not committed)
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

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8000`.

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

## 🌐 Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com) — auto-deploys on push to `main`
- **Backend**: Deploy on Railway, Render, or any platform supporting Python/Docker
- Set `VITE_API_URL` in Vercel environment variables to point to your backend URL

---

## 📊 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Authenticate user, returns JWT |
| GET | `/api/eeg/classify?patient_id=` | Real-time EEG emotion classification |
| GET | `/api/eeg/waveform?patient_id=` | Live waveform band power series |
| GET | `/api/patients` | List all patients |
| GET | `/api/patients/{id}/report` | Generate PDF report (auth required) |
| GET | `/api/alerts` | Get active alerts |
| GET | `/api/messages/{patient_id}` | Get messages for patient |
| GET | `/api/admin/*` | Admin-only endpoints (role guard) |

---

## 👩‍💻 Developed By

**Aakanksha Langhani** — Final Year Project, 2024–2025

---

## 📄 License

This project is for academic purposes only. The GAMEEMO dataset is used under its original research license.
