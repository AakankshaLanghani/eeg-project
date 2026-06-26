"""
eeg_engine.py — Real EEG data engine for NeuroTrack
=====================================================
Loads the trained XGBoost model and GAMEEMO CSV data.
Maps each patient to a GAMEEMO subject + game session.
Cycles through real EEG windows continuously.
Returns real band powers + XGBoost emotion predictions.
"""

import os
import glob
import numpy as np
import pandas as pd
from scipy.signal import welch
import xgboost as xgb
import joblib

# ─── Config ───────────────────────────────────────────────────────────────────
FS      = 128
WINDOW  = 256   # 2-second window
STEP    = 128   # 50% overlap

BANDS = {
    "delta": (0.5,  4),
    "theta": (4,    8),
    "alpha": (8,   13),
    "beta":  (13,  30),
    "gamma": (30,  45),
}

CHANNELS = ["AF3","AF4","F3","F4","F7","F8","FC5","FC6","O1","O2","P7","P8","T7","T8"]

LABEL_NAMES = {0: "Happy", 1: "Sad", 2: "Calm", 3: "Stress"}
# Note: GAMEEMO G4 = Stress/Pain — we map to "Pain" for Usman specifically
PAIN_PATIENT_ID = 3  # Usman Khan

# ─── Patient → GAMEEMO subject mapping ───────────────────────────────────────
# patient_id : (subject_folder, game_number)
# Chosen so each patient's dominant emotion matches their clinical condition
PATIENT_SUBJECT_MAP = {
    1: ("(S01)", 3),   # Ahmed Raza    — Post-surgery     → Calm   (G3)
    2: ("(S02)", 4),   # Fatima Malik  — Anxiety disorder → Stress (G4)
    3: ("(S03)", 4),   # Usman Khan    — Chronic pain     → Pain   (G4)
    4: ("(S04)", 1),   # Zara Hussain  — Epilepsy monitor → Happy  (G1)
    5: ("(S05)", 2),   # Ali Hassan    — TBI recovery     → Sad    (G2)
}

GAMEEMO_ROOT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "GAMEEMO"
)

MODEL_DIR    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
MODEL_PATH   = os.path.join(MODEL_DIR, "xgboost_emotion_model.json")
SCALER_PATH  = os.path.join(MODEL_DIR, "scaler.pkl")

# ─── Feature extraction (same as training) ───────────────────────────────────

def _bandpower(sig, fs, band):
    freqs, psd = welch(sig, fs=fs, nperseg=min(128, len(sig)))
    idx = np.logical_and(freqs >= band[0], freqs <= band[1])
    return float(np.trapz(psd[idx], freqs[idx]))


def _extract_features(epoch):
    """epoch: (WINDOW, 14) → 112-element feature vector"""
    feats = []
    for ch in range(epoch.shape[1]):
        sig = epoch[:, ch]
        feats.append(float(np.mean(sig)))
        feats.append(float(np.std(sig)))
        feats.append(float(np.var(sig)))
        for band in BANDS.values():
            feats.append(_bandpower(sig, FS, band))
    return np.array(feats, dtype=np.float32)


def _extract_band_display(epoch):
    """Returns average band powers across all 14 channels for waveform display."""
    band_totals = {b: 0.0 for b in BANDS}
    for ch in range(epoch.shape[1]):
        sig = epoch[:, ch]
        for bname, brange in BANDS.items():
            band_totals[bname] += _bandpower(sig, FS, brange)
    n = epoch.shape[1]
    return {b: round(v / n, 4) for b, v in band_totals.items()}


def _windows_from_signal(signal):
    """Slide window → list of (feature_vector, raw_epoch) tuples."""
    results = []
    start = 0
    while start + WINDOW <= signal.shape[0]:
        epoch = signal[start: start + WINDOW]
        results.append((_extract_features(epoch), epoch.copy()))
        start += STEP
    return results


# ─── Engine class ─────────────────────────────────────────────────────────────

class EEGEngine:
    def __init__(self):
        self.model   = None
        self.scaler  = None
        self.windows = {}   # patient_id → list of (features, epoch)
        self.indices = {}   # patient_id → current position
        self.ready   = False

    def load(self):
        """Call once at server startup."""
        print("[EEGEngine] Loading model and data...")

        # ── Load model
        if not os.path.exists(MODEL_PATH):
            print(f"[EEGEngine] ⚠ Model not found at {MODEL_PATH}")
            print("[EEGEngine] Run train_emotion_classifier.py first, then copy model files to backend/model/")
            self.ready = False
            return

        self.model = xgb.XGBClassifier()
        self.model.load_model(MODEL_PATH)
        self.scaler = joblib.load(SCALER_PATH)
        print("[EEGEngine] ✓ Model loaded")

        # ── Load GAMEEMO data per patient
        for patient_id, (subject, game_num) in PATIENT_SUBJECT_MAP.items():
            subj_id = subject.strip("()")
            csv_path = os.path.join(
                GAMEEMO_ROOT, subject,
                "Preprocessed EEG Data", ".csv format",
                f"{subj_id}G{game_num}AllChannels.csv"
            )
            if not os.path.exists(csv_path):
                print(f"[EEGEngine] ⚠ Missing: {csv_path}")
                continue

            try:
                df = pd.read_csv(csv_path, header=0)
                df = df[[c for c in CHANNELS if c in df.columns]]
                signal = df.values.astype(np.float32)
                wins = _windows_from_signal(signal)
                self.windows[patient_id] = wins
                self.indices[patient_id] = 0
                print(f"[EEGEngine] ✓ Patient {patient_id} → {subject} G{game_num} ({len(wins)} windows)")
            except Exception as e:
                print(f"[EEGEngine] ✗ Error loading {csv_path}: {e}")

        self.ready = len(self.windows) > 0
        print(f"[EEGEngine] Ready: {self.ready} ({len(self.windows)} patients loaded)")

    def next_reading(self, patient_id: int) -> dict:
        """
        Returns the next real EEG classification for a patient.
        Cycles infinitely through their assigned GAMEEMO windows.
        """
        if not self.ready or patient_id not in self.windows:
            return self._fallback()

        wins = self.windows[patient_id]
        idx  = self.indices[patient_id]

        features, epoch = wins[idx]
        self.indices[patient_id] = (idx + 1) % len(wins)

        # Scale + predict
        X = self.scaler.transform(features.reshape(1, -1))
        label_idx  = int(self.model.predict(X)[0])
        proba      = self.model.predict_proba(X)[0]
        confidence = round(float(proba[label_idx]) * 100, 1)

        # Map label — G4 patients get "Pain" label instead of "Stress"
        emotion = LABEL_NAMES[label_idx]
        if patient_id == PAIN_PATIENT_ID and emotion == "Stress":
            emotion = "Pain"

        # Band powers for waveform display (averaged across 14 channels)
        bands = _extract_band_display(epoch)

        return {
            "emotion":    emotion,
            "confidence": confidence,
            "bands": {
                "alpha": bands["alpha"],
                "beta":  bands["beta"],
                "theta": bands["theta"],
                "delta": bands["delta"],
            },
        }

    def get_waveform_series(self, patient_id: int, n_points: int = 80) -> list:
        """
        Returns a series of band power readings for the live waveform chart.
        Pulls n_points consecutive windows without advancing the main index.
        """
        if not self.ready or patient_id not in self.windows:
            return self._fallback_waveform(n_points)

        wins  = self.windows[patient_id]
        start = self.indices[patient_id]
        points = []

        for i in range(n_points):
            _, epoch = wins[(start + i) % len(wins)]
            bands = _extract_band_display(epoch)
            # Scale to display range 20-80 (same as before)
            def scale(v, lo=0.0, hi=2.0):
                return round(20 + 60 * min(max((v - lo) / (hi - lo), 0), 1), 2)
            points.append({
                "alpha": scale(bands["alpha"]),
                "beta":  scale(bands["beta"]),
                "theta": scale(bands["theta"]),
                "delta": scale(bands["delta"]),
            })

        return points

    def _fallback(self):
        """Returns a safe default if engine not ready."""
        import random, math, time
        t = time.time()
        return {
            "emotion":    "Calm",
            "confidence": round(random.uniform(70, 85), 1),
            "bands": {
                "alpha": round(0.3 + 0.2 * math.sin(t * 0.05), 4),
                "beta":  round(0.2 + 0.2 * math.sin(t * 0.08), 4),
                "theta": round(0.4 + 0.1 * math.sin(t * 0.03), 4),
                "delta": round(0.5 + 0.1 * math.sin(t * 0.02), 4),
            },
        }

    def _fallback_waveform(self, n_points):
        import random, math, time
        t = time.time()
        return [
            {
                "alpha": round(50 + 20 * math.sin(t * 0.3 + i * 0.1)  + 2 * random.random(), 2),
                "beta":  round(50 + 15 * math.sin(t * 0.5 + i * 0.1)  + 2 * random.random(), 2),
                "theta": round(50 + 18 * math.sin(t * 0.2 + i * 0.1)  + 2 * random.random(), 2),
                "delta": round(50 + 22 * math.sin(t * 0.15 + i * 0.1) + 2 * random.random(), 2),
            }
            for i in range(n_points)
        ]


# ─── Singleton ────────────────────────────────────────────────────────────────
engine = EEGEngine()
