from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image
import io, os, time

# --- Config via env vars ---
MODEL_PATH = os.getenv("MODEL_PATH", "weights/best.pt")
CONF = float(os.getenv("CONF", 0.5))   # score threshold
IOU  = float(os.getenv("IOU", 0.5))    # NMS threshold
IMG  = int(os.getenv("IMG", 640))      # inference size
API_KEY = os.getenv("INFERENCE_API_KEY", "")  # optional simple protection

app = FastAPI(title="YOLOv8 PPE Inference")

# (optional) allow your sites in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load model once on startup ---
model = YOLO(MODEL_PATH)
CLASS_NAMES = model.names  # dict: id -> name

@app.get("/health")
def health():
    return {"status": "ok", "classes": CLASS_NAMES, "model_path": MODEL_PATH}

def _check_key(x_api_key: str | None):
    if API_KEY and (x_api_key != API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API key")

@app.post("/predict")
async def predict(file: UploadFile = File(...), x_api_key: str | None = Header(default=None)):
    _check_key(x_api_key)

    t0 = time.time()
    raw = await file.read()
    img = Image.open(io.BytesIO(raw)).convert("RGB")

    # run model
    results = model.predict(source=img, conf=CONF, iou=IOU, imgsz=IMG, save=False, verbose=False)

    dets = []
    if results:
        r = results[0]
        boxes = getattr(r, "boxes", None)
        if boxes is not None and boxes.xyxy is not None:
            for b in boxes:
                x1, y1, x2, y2 = map(float, b.xyxy[0].tolist())
                conf = float(b.conf[0].item())
                cls  = int(b.cls[0].item())
                dets.append({
                    "class_id": cls,
                    "class_name": CLASS_NAMES.get(cls, str(cls)),
                    "confidence": conf,
                    "box_xyxy": [x1, y1, x2, y2]
                })

    return JSONResponse({
        "time_ms": int((time.time()-t0)*1000),
        "count": len(dets),
        "detections": dets
    })
