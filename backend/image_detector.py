# image_detector.py
import requests
import base64
import json
from PIL import Image
import io

HF_TOKEN = "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"
IMAGE_MODEL = "prithivMLmods/Deep-Fake-Detector-v2-Model"
API_URL = f"https://api-inference.huggingface.co/models/{IMAGE_MODEL}"

HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

def detect_image_via_api(image_path: str) -> dict:
    # Read and send image as bytes
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    response = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        data=image_bytes,
        timeout=30
    )

    if response.status_code == 503:
        # Model is loading — wait and retry
        import time
        time.sleep(20)
        response = requests.post(
            API_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            data=image_bytes,
            timeout=30
        )

    results = response.json()

    # Results come as:
    # [{"label": "Deepfake", "score": 0.94}, {"label": "Realism", "score": 0.06}]
    deepfake_score = 0
    real_score = 0

    for item in results:
        if "deepfake" in item["label"].lower() or "fake" in item["label"].lower():
            deepfake_score = item["score"]
        else:
            real_score = item["score"]

    verdict = "DEEPFAKE" if deepfake_score > 0.5 else "AUTHENTIC"
    confidence = round(max(deepfake_score, real_score) * 100, 2)

    return {
        "verdict": verdict,
        "confidence": confidence,
        "fake_probability": round(deepfake_score * 100, 2),
        "real_probability": round(real_score * 100, 2),
        "severity": get_severity(deepfake_score),
        "raw_scores": results
    }

def get_severity(score: float) -> str:
    if score >= 0.90: return "CRITICAL"
    if score >= 0.75: return "HIGH"
    if score >= 0.50: return "MEDIUM"
    return "LOW"