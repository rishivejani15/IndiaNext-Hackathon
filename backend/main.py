# main.py — SENTINEL Deepfake Detection API
# Local model inference — no HuggingFace API calls for detection
# Explainer uses HF chat router (Mistral-7B)

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import shutil
import os
import uuid
import tempfile

load_dotenv()  # Load HF_TOKEN and any other env vars

from image_detector import ImageDetector
from video_detector import VideoDetector
from explainer import explain_detection

# ── App setup ────────────────────────────────────────────────

app = FastAPI(
    title="SENTINEL Deepfake Detection API",
    version="2.0.0",
    description=(
        "Detect AI-generated images and deepfake videos using a local ViT model. "
        "Explanations powered by Mistral-7B via HuggingFace chat router."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = tempfile.gettempdir()
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp"}

# ── Load models once at startup (not per request) ────────────

print("\n🛡️  SENTINEL Deepfake Detection API")
print("=" * 45)
image_detector = ImageDetector()
video_detector = VideoDetector(image_detector)
print("=" * 45)
print("✅ All models loaded. API ready.\n")


# ── Helper ───────────────────────────────────────────────────

def _save_upload(file: UploadFile, ext: str) -> str:
    """Save an uploaded file to a temp path and return the path."""
    temp_path = os.path.join(TEMP_DIR, f"sentinel_{uuid.uuid4()}.{ext}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return temp_path


def _cleanup(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


# ── Routes ───────────────────────────────────────────────────

@app.post("/detect/image", summary="Detect deepfake in an image")
async def detect_image(file: UploadFile = File(...)):
    """
    Upload a JPEG / PNG / WebP image.
    Returns verdict, confidence, severity, forensic explanation, and recommended action.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            400,
            f"Unsupported file type '{file.content_type}'. "
            f"Accepted: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    ext = (file.filename or "upload.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        ext = "jpg"

    temp_path = None
    try:
        temp_path = _save_upload(file, ext)
        detection = image_detector.detect(temp_path)
        explanation = explain_detection(detection, "image")

        return {
            "input_type": "image",
            "filename": file.filename,
            **detection,
            **explanation,
        }

    except RuntimeError as e:
        raise HTTPException(503, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=f"Detection failed: {str(e)}")
    finally:
        _cleanup(temp_path)


@app.post("/detect/video", summary="Detect deepfake in a video")
async def detect_video(file: UploadFile = File(...)):
    """
    Upload an MP4 / MOV / AVI / WebM video.
    Analyzes up to 8 sampled frames and returns an aggregated verdict with timeline.
    """
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(
            400,
            f"Unsupported file type '{file.content_type}'. Expected a video file."
        )

    ext = (file.filename or "upload.mp4").rsplit(".", 1)[-1].lower()

    temp_path = None
    try:
        temp_path = _save_upload(file, ext)
        detection = video_detector.detect(temp_path)
        explanation = explain_detection(detection, "video")

        return {
            "input_type": "video",
            "filename": file.filename,
            **detection,
            **explanation,
        }

    except RuntimeError as e:
        raise HTTPException(503, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=f"Detection failed: {str(e)}")
    finally:
        _cleanup(temp_path)


@app.get("/health", summary="Health check")
async def health():
    return {
        "status": "running",
        "inference_mode": "local (no HuggingFace API for detection)",
        "models": {
            "image": "prithivMLmods/Deepfake-Detection-Exp-02-21 (ViT, 98.8% accuracy)",
            "video": "frame-by-frame using image model (8 frames sampled)",
            "explainer": "mistralai/Mistral-7B-Instruct-v0.3 via HF chat router",
        },
    }


# ── Entry point ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("📖 API docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)