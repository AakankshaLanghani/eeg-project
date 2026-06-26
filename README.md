# 🧠 NeuroTrack — EEG-Based Emotion Recognition System

<div align="center">

![NeuroTrack](https://img.shields.io/badge/NeuroTrack-EEG%20Monitor-2563EB?style=for-the-badge&logo=activity&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![XGBoost](https://img.shields.io/badge/XGBoost-87.83%25-FF6600?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-purple?style=for-the-badge)

**A real-time hospital monitoring platform that detects patient emotional states from EEG signals using machine learning — built for clinicians when verbal communication is not possible.**

[Live Demo](https://eeg-project-one.vercel.app) · [Backend API](https://aakankshaa13-neurotrack-backend.hf.space/docs) · [Report Bug](https://github.com/AakankshaLanghani/eeg-project/issues)

</div>

---

## 📸 Preview

| Login Page | Doctor Dashboard | Live Monitor |
|-----------|-----------------|--------------|
| Premium split-screen UI | Real-time patient overview | Per-patient EEG streaming |

---

## 📌 What is NeuroTrack?

NeuroTrack is a **Final Year Project** — a full-stack medical AI web application that:

- Streams real EEG data from the **GAMEEMO dataset** (28 subjects, 14 channels, 128Hz)
- Classifies emotions in real-time using a trained **XGBoost model** (87.83% accuracy)
- Presents results through a clean clinical dashboard for **Doctors, Patients, and Admins**
- Sends automated alerts when critical emotional states (Pain, Stress) are detected

---

## ✨ Features

### 🩺 Doctor Dashboard
- Real-time EEG waveform monitoring per patient (polls every 3 seconds)
- Emotion classification with confidence scores (Happy / Sad / Calm / Stress / Pain)
- Band power charts — Alpha, Beta, Theta, Delta
- Clinical notes and AI-powered treatment suggestions via **NeuroAssist**
- Smart alert system with acknowledgement
- Patient scheduling and appointment management
- PDF report generation (auth-protected)
- Secure doctor ↔ patient messaging

### 🧑‍⚕️ Patient Portal
- Personal EEG readings and emotion history
- EEG session timeline
- Messaging with assigned doctor
- Profile and settings management

### 🛡️ Admin Panel
- Full user management (create / edit / delete Doctors, Patients, Admins)
- Patient record management
- Alert threshold configuration
- Full audit log of all system actions
- System statistics overview

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite |
| **Backend** | FastAPI (Python 3.10) |
| **Database** | SQLite with WAL mode |
| **ML Model** | XGBoost (87.83% accuracy) |
| **Authentication** | JWT (HS256) + bcrypt password hashing |
| **EEG Dataset** | GAMEEMO (28 subjects × 4 games × 14 channels @ 128Hz) |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Hugging Face Spaces (Docker) |

---

## 🧠 ML & EEG Details

### Dataset — GAMEEMO
- 28 subjects played 4 video games designed to elicit different emotions
- **G1** → Happy · **G2** → Sad · **G3** → Calm · **G4** → Stress/Pain
- 14 EEG channels: `AF3, AF4, F3, F4, F7, F8, FC5, FC6, O1, O2, P7, P8, T7, T8`

### Feature Extraction
- **Window**: 2-second sliding window, 50% overlap (256 samples @ 128Hz)
- **Per channel**: mean, std, variance + 5 band powers = **8 features**
- **Total**: 14 channels × 8 = **112 features per window**

### Band Powers
| Band | Frequency | Association |
|------|-----------|-------------|
| Delta | 0.5 – 4 Hz | Deep sleep, pain |
| Theta | 4 – 8 Hz | Drowsiness, stress |
| Alpha | 8 – 13 Hz | Relaxation, calm |
| Beta | 13 – 30 Hz | Active thinking, anxiety |
| Gamma | 30 – 45 Hz | High cognition |

### Model Performance
- **Algorithm**: XGBoost Classifier
- **Accuracy**: **87.83%**
- **Classes**: Happy, Sad, Calm, Stress, Pain

### Patient → GAMEEMO Mapping

| Patient | Condition | EEG Source | Dominant Emotion |
|---------|-----------|------------|-----------------|
| Ahmed Raza | Post-surgery recovery | S01 · Game 3 | 😌 Calm |
| Fatima Malik | Anxiety disorder | S02 · Game 4 | 😰 Stress |
| Usman Khan | Chronic pain | S03 · Game 4 | 😣 Pain |
| Zara Hussain | Epilepsy monitoring | S04 · Game 1 | 😊 Happy |
| Ali Hassan | TBI recovery | S05 · Game 2 | 😢 Sad |

---

## 🗂️ Project Structure

```
eeg-project/
├── backend/
│   ├── main.py                        # FastAPI app — all API routes
│   ├── database.py                    # SQLite schema, seeding, queries
│   ├── eeg_engine.py                  # GAMEEMO loader + XGBoost inference
│   ├── model/
│   │   ├── xgboost_emotion_model.json # Trained model (Git LFS)
│   │   └── scaler.pkl                 # Feature scaler (Git LFS)
│   ├── Dockerfile                     # HF Spaces deployment
│   ├── requirements.txt
│   └── neurotrack.db                  # SQLite database
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Doctor + Patient dashboards (~2800 lines)
│   │   ├── AdminApp.jsx               # Admin panel
│   │   ├── api.js                     # API client with JWT auth
│   │   └── index.css                  # Global styles + mobile responsive
│   └── public/
│       └── image.png                  # Login illustration
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- GAMEEMO dataset (place in `../GAMEEMO/` relative to backend)
- Trained model files in `backend/model/`

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

App runs at `http://localhost:5173`, API at `http://localhost:8000`

### Environment Variables
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 👨‍⚕️ Doctor | dr.aakanksha@hospital.com | password |
| 🧑‍⚕️ Patient | asra@hospital.com | password |
| 🧑‍⚕️ Patient | fatima@hospital.com | password |
| 🧑‍⚕️ Patient | usman@hospital.com | password |
| 🛡️ Admin | sanjana@hospital.com | admin123 |

---

## 🌐 Deployment

### Frontend → Vercel
1. Import `eeg-project` repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** → `frontend`
3. Add environment variable: `VITE_API_URL` = your backend URL
4. Deploy

### Backend → Hugging Face Spaces
1. Create a new Space with **Docker** SDK
2. Push the `backend/` folder contents
3. Model files use **Git LFS**
4. Space auto-builds from `Dockerfile`

---

## 📊 Key API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | ❌ | Authenticate, returns JWT |
| GET | `/api/eeg/classify?patient_id=` | ✅ | Real-time emotion classification |
| GET | `/api/eeg/waveform?patient_id=` | ✅ | Live band power waveform |
| GET | `/api/patients` | ✅ | List all patients |
| GET | `/api/patients/{id}/report` | ✅ | Generate PDF report |
| GET | `/api/alerts` | ✅ | Active alerts |
| POST | `/api/alerts/acknowledge` | ✅ | Acknowledge alert |
| GET | `/api/messages/{patient_id}` | ✅ | Patient messages |
| GET | `/api/admin/*` | ✅ Admin only | Admin endpoints |

Full interactive docs: `https://aakankshaa13-neurotrack-backend.hf.space/docs`

---

## 👩‍💻 Developed By

**Aakanksha Langhani**  
Final Year Project · 2024–2025

---

## 📄 License

This project is for **academic purposes only**.  
The GAMEEMO dataset is used under its original research license.
