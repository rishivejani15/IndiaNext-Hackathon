# video_detector.py
import requests
import cv2
import os
import uuid
from image_detector import detect_image_via_api, get_severity

HF_TOKEN = "hf_your_token_here"
VIDEO_MODEL = "tayyabimam/Deepfake"
VIDEO_API_URL = f"https://api-inference.huggingface.co/models/{VIDEO_MODEL}"

def detect_video_via_api(video_path: str) -> dict:
    # First try direct video API
    with open(video_path, "rb") as f:
        video_bytes = f.read()

    response = requests.post(
        VIDEO_API_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        data=video_bytes,
        timeout=60
    )

    if response.status_code == 200:
        results = response.json()
        return parse_video_result(results)

    # Fallback: extract frames → analyze each with image model
    # This always works and is actually more explainable
    print("Video API unavailable, falling back to frame analysis...")
    return detect_video_via_frames(video_path)


def detect_video_via_frames(video_path: str) -> dict:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = round(total_frames / fps, 2) if fps > 0 else 0

    frame_results = []
    frame_count = 0
    max_samples = 8  # Enough for demo, fast enough to not timeout

    while cap.isOpened() and len(frame_results) < max_samples:
        ret, frame = cap.read()
        if not ret:
            break

        # Sample every Nth frame evenly across video
        sample_every = max(1, total_frames // max_samples)

        if frame_count % sample_every == 0:
            temp_path = f"/tmp/frame_{uuid.uuid4()}.jpg"
            cv2.imwrite(temp_path, frame)

            try:
                result = detect_image_via_api(temp_path)
                result["timestamp_seconds"] = round(frame_count / fps, 2) if fps > 0 else 0
                result["frame_number"] = frame_count
                frame_results.append(result)
            except Exception as e:
                print(f"Frame {frame_count} failed: {e}")
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        frame_count += 1

    cap.release()

    if not frame_results:
        return {"error": "Could not extract frames from video"}

    return aggregate_frame_results(frame_results, duration)


def aggregate_frame_results(frame_results: list, duration: float) -> dict:
    fake_frames = [r for r in frame_results if r["verdict"] == "DEEPFAKE"]
    real_frames = [r for r in frame_results if r["verdict"] == "AUTHENTIC"]
    fake_ratio = len(fake_frames) / len(frame_results)
    avg_confidence = sum(r["confidence"] for r in frame_results) / len(frame_results)

    # Find highest confidence fake frame for reporting
    worst_frame = max(frame_results, key=lambda x: x["fake_probability"])

    return {
        "verdict": "DEEPFAKE" if fake_ratio >= 0.3 else "AUTHENTIC",
        "confidence": round(avg_confidence, 2),
        "severity": get_severity(fake_ratio),
        "fake_ratio_percent": round(fake_ratio * 100, 2),
        "frames_analyzed": len(frame_results),
        "fake_frames_count": len(fake_frames),
        "real_frames_count": len(real_frames),
        "duration_seconds": duration,
        "most_suspicious_timestamp": worst_frame.get("timestamp_seconds", 0),
        "timeline": frame_results
    }


def parse_video_result(api_result: list) -> dict:
    fake_score = 0
    for item in api_result:
        if "fake" in item.get("label", "").lower():
            fake_score = item["score"]
            break

    return {
        "verdict": "DEEPFAKE" if fake_score > 0.5 else "AUTHENTIC",
        "confidence": round(max(fake_score, 1 - fake_score) * 100, 2),
        "fake_probability": round(fake_score * 100, 2),
        "severity": get_severity(fake_score)
    }