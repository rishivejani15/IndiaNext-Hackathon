# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid

from image_detector import detect_image_via_api
from video_detector import detect_video_via_frames
from explainer import explain_detection

app = FastAPI(title="SENTINEL Deepfake Detection API v1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/detect/image")
async def detect_image(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg","image/png","image/webp"]:
        raise HTTPException(400, "Only JPEG/PNG/WebP images accepted")

    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        detection   = detect_image_via_api(temp_path)
        explanation = explain_detection(detection, "image")

        return {
            "input_type": "image",
            **detection,
            **explanation
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "Only video files accepted")

    temp_path = f"/tmp/{uuid.uuid4()}.mp4"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        detection   = detect_video_via_frames(temp_path)
        explanation = explain_detection(detection, "video")

        return {
            "input_type": "video",
            **detection,
            **explanation
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/health")
async def health():
    return {"status": "running", "models": {
        "image": "prithivMLmods/Deep-Fake-Detector-v2-Model",
        "video": "tayyabimam/Deepfake (frame analysis fallback)"
    }}