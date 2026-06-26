"""
setup_model.py
==============
Run this ONCE before starting the server.
Trains XGBoost on GAMEEMO data and saves the model to backend/model/
Usage:
    cd eeg-project/backend
    python setup_model.py
"""

import os, sys, glob
import numpy as np
import pandas as pd
from scipy.signal import welch
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import joblib

# ─── Config ───────────────────────────────────────────────────────────────────
GAMEEMO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "GAMEEMO")
OUT_DIR      = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(OUT_DIR, exist_ok=True)

FS       = 128
WINDOW   = 256
STEP     = 128
BANDS    = {"delta":(0.5,4),"theta":(4,8),"alpha":(8,13),"beta":(13,30),"gamma":(30,45)}
CHANNELS = ["AF3","AF4","F3","F4","F7","F8","FC5","FC6","O1","O2","P7","P8","T7","T8"]
LABEL_MAP = {1:0, 2:1, 3:2, 4:3}
LABEL_NAMES = {0:"Happy", 1:"Sad", 2:"Calm", 3:"Stress"}

def bandpower(sig, fs, band):
    freqs, psd = welch(sig, fs=fs, nperseg=min(128, len(sig)))
    idx = np.logical_and(freqs >= band[0], freqs <= band[1])
    return float(np.trapz(psd[idx], freqs[idx]))

def extract_features(epoch):
    feats = []
    for ch in range(epoch.shape[1]):
        sig = epoch[:, ch]
        feats += [np.mean(sig), np.std(sig), np.var(sig)]
        for band in BANDS.values():
            feats.append(bandpower(sig, FS, band))
    return np.array(feats, dtype=np.float32)

def windows_from_signal(signal):
    results, start = [], 0
    while start + WINDOW <= signal.shape[0]:
        results.append(extract_features(signal[start:start+WINDOW]))
        start += STEP
    return results

def load_all_subjects():
    X_list, y_list = [], []
    subject_dirs = sorted(glob.glob(os.path.join(GAMEEMO_ROOT, "(S*)")))
    print(f"Found {len(subject_dirs)} subjects in {GAMEEMO_ROOT}")
    if not subject_dirs:
        print("ERROR: No subject folders found. Check GAMEEMO path.")
        sys.exit(1)

    for s_dir in subject_dirs:
        subj_id = os.path.basename(s_dir).strip("()")
        csv_dir = os.path.join(s_dir, "Preprocessed EEG Data", ".csv format")
        for g in range(1, 5):
            fpath = os.path.join(csv_dir, f"{subj_id}G{g}AllChannels.csv")
            if not os.path.exists(fpath):
                continue
            try:
                df    = pd.read_csv(fpath, header=0)
                df    = df[[c for c in CHANNELS if c in df.columns]]
                feats = windows_from_signal(df.values.astype(np.float32))
                X_list.extend(feats)
                y_list.extend([LABEL_MAP[g]] * len(feats))
                print(f"  ✓ {subj_id} G{g} → {len(feats)} windows")
            except Exception as e:
                print(f"  ✗ {subj_id} G{g}: {e}")

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32)

def main():
    print("=" * 55)
    print("  NeuroTrack — Training XGBoost on GAMEEMO Dataset")
    print("=" * 55)

    print("\n[1/3] Loading & extracting features...")
    X, y = load_all_subjects()
    print(f"\nDataset: {X.shape[0]} samples × {X.shape[1]} features")
    for lbl, name in LABEL_NAMES.items():
        print(f"  {name}: {np.sum(y == lbl)} samples")

    print("\n[2/3] Scaling + training XGBoost...")
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y)

    model = xgb.XGBClassifier(
        n_estimators     = 400,
        max_depth        = 7,
        learning_rate    = 0.05,
        subsample        = 0.9,
        colsample_bytree = 0.9,
        tree_method      = "hist",
        objective        = "multi:softmax",
        num_class        = 4,
        n_jobs           = -1,
        random_state     = 42,
        eval_metric      = "mlogloss",
    )
    model.fit(X_train, y_train,
              eval_set=[(X_test, y_test)], verbose=50)

    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    print(f"\n[3/3] Accuracy: {acc*100:.2f}%")
    print(classification_report(y_test, y_pred,
          target_names=[LABEL_NAMES[i] for i in range(4)]))

    model_path  = os.path.join(OUT_DIR, "xgboost_emotion_model.json")
    scaler_path = os.path.join(OUT_DIR, "scaler.pkl")
    model.save_model(model_path)
    joblib.dump(scaler, scaler_path)

    print(f"\n✓ Model  → {model_path}")
    print(f"✓ Scaler → {scaler_path}")
    print("\nDone! You can now start the server: uvicorn main:app --reload")

if __name__ == "__main__":
    main()
