// --- Imports ---
import { RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import multer from "multer";
import {
  SaveUploadResponse,
  UploadEntry,
  UploadedFileData,
  UploadHistoryResponse,
  MLImagesResponse,
  MLImageData,
  UploadStatsResponse,
} from "@shared/api";

import fetch from "node-fetch";
import FormData from "form-data";
import { createReadStream } from "fs";

// --- ML Server Configuration ---
const ML_API_URL = "http://127.0.0.1:8000/predict";
const ALERT_CLASSES = new Set(["no_helmet", "no_vest", "no_glove", "no_mask", "no_shoes"]);

// --- Paths / Data storage ---
const DATA_DIR = path.join(process.cwd(), "server/data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const UPLOADS_FILE = path.join(DATA_DIR, "uploads.json");

// --- Extended Upload Type (adds mlResults) ---
type UploadEntryWithML = UploadEntry & {
  mlResults?: MLResponse[];
};

// --- Multer ---
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDirectory();
    if (!(req as any).uploadId) {
      (req as any).uploadId = `upload-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
    }
    const uploadId = (req as any).uploadId;
    const uploadDir = path.join(UPLOADS_DIR, uploadId);
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, "_");
    cb(null, `${sanitized}-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image/video allowed"));
    }
  }
});

// --- FS Helpers ---
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function ensureUploadsDirectory() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// ✅ SAFE READ
async function readUploads(): Promise<UploadEntryWithML[]> {
  try {
    await ensureDataDirectory();

    try {
      await fs.access(UPLOADS_FILE);
    } catch {
      await fs.writeFile(UPLOADS_FILE, "[]", "utf-8");
      return [];
    }

    const raw = await fs.readFile(UPLOADS_FILE, "utf-8");
    if (!raw.trim()) return [];

    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ✅ SAFE WRITE
async function writeUploads(uploads: UploadEntryWithML[]) {
  await ensureDataDirectory();
  await fs.writeFile(UPLOADS_FILE, JSON.stringify(uploads, null, 2), "utf-8");
}

// --- ML Response Type ---
interface MLDetection {
  class_id: number;
  class_name: string;
  confidence: number;
  box_xyxy: [number, number, number, number];
}

interface MLResponse {
  time_ms: number;
  count: number;
  detections: MLDetection[];
  filename?: string;
}

// --- Run ML Prediction ---
async function runPrediction(filePath: string, fileType: string, originalName: string): Promise<MLResponse | null> {
  if (!fileType.startsWith("image/")) return null;

  try {
    const form = new FormData();
    form.append("file", createReadStream(filePath));

    const res = await fetch(ML_API_URL, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });

    if (!res.ok) {
      console.error(`ML error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = (await res.json()) as MLResponse;
    json.filename = originalName;
    return json;

  } catch (err) {
    console.error("Prediction error:", err);
    return null;
  }
}

// --- SAVE UPLOAD ---
export const handleSaveUpload: RequestHandler = async (req, res) => {
  try {
    const { constructionType, siteLocation, supervisorName, uploadDate, notes = "" } = req.body;

    if (!constructionType || !siteLocation || !supervisorName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const uploads = await readUploads();
    const uploadId = (req as any).uploadId || `upload-${Date.now()}`;

    const fileData: UploadedFileData[] = files.map((file, index) => {
      const relativePath = `uploads/${uploadId}/${file.filename}`;
      return {
        id: `file-${uploadId}-${index}`,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        path: relativePath,
        absolutePath: path.join(UPLOADS_DIR, uploadId, file.filename)
      };
    });

    console.log(`Running ML on ${fileData.length} files`);

    const mlResultsRaw = await Promise.all(
      fileData.map(f => runPrediction(f.absolutePath, f.type, f.name))
    );

    const mlResults = mlResultsRaw.filter(r => r !== null) as MLResponse[];

    const hasViolations = mlResults.some(r =>
      r.detections.some(d => ALERT_CLASSES.has(d.class_name))
    );

    if (hasViolations) {
      console.log(`⚠️ SAFETY VIOLATION DETECTED in upload: ${uploadId}`);
    }

    const newUpload: UploadEntryWithML = {
      id: uploadId,
      constructionType,
      siteLocation,
      supervisorName,
      uploadDate,
      notes,
      files: fileData,
      createdAt: new Date().toISOString(),
      mlResults
    };

    uploads.push(newUpload);
    await writeUploads(uploads);

    const response: SaveUploadResponse = {
      success: true,
      id: newUpload.id,
      message: "Upload saved successfully"
    };

    res.status(200).json(response);

  } catch (err) {
    console.error("Error saving upload:", err);
    res.status(500).json({ success: false, message: "Failed to save upload" });
  }
};

// --- ALERT FEED ---
export const handleGetUploadAlerts: RequestHandler = async (_req, res) => {
  try {
    const uploads = await readUploads();
    const alerts: any[] = [];

    for (const upload of uploads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) {
      if (!upload.mlResults) continue;

      let fileCount = 0;
      let violations: string[] = [];

      for (const r of upload.mlResults) {
        if (r?.detections) {
          fileCount++;
          const bad = r.detections.filter(d => ALERT_CLASSES.has(d.class_name));
          if (bad.length) {
            violations.push(
              `File '${r.filename}' → ${[...new Set(bad.map(x => x.class_name))].join(", ")}`
            );
          }
        }
      }

      alerts.push({
        id: `ppe-${upload.id}`,
        title: violations.length ? "Safety Violation" : "All Clear",
        description: violations.length
          ? violations.join(" | ")
          : `Checked ${fileCount} image(s). All PPE OK.`,
        severity: violations.length ? "high" : "low",
        time: upload.createdAt,
        location: upload.siteLocation
      });
    }

    res.status(200).json({ alerts });

  } catch (err) {
    console.error(err);
    res.status(500).json({ alerts: [] });
  }
};

// --- Additional read endpoints ---
export const handleGetUploadHistory: RequestHandler = async (_req, res) => {
  try {
    const uploads = await readUploads();
    // strip mlResults when returning history to match UploadEntry shape
    const simpleUploads: UploadEntry[] = uploads.map(u => ({
      id: u.id,
      constructionType: u.constructionType,
      siteLocation: u.siteLocation,
      supervisorName: u.supervisorName,
      uploadDate: u.uploadDate,
      notes: u.notes,
      files: u.files,
      createdAt: u.createdAt,
    }));

    const response: UploadHistoryResponse = { uploads: simpleUploads };
    res.status(200).json(response);
  } catch (err) {
    console.error("Error getting upload history:", err);
    res.status(500).json({ uploads: [] } as UploadHistoryResponse);
  }
};

export const handleGetUploadStats: RequestHandler = async (_req, res) => {
  try {
    const uploads = await readUploads();
    const totalUploads = uploads.length;
    const totalImages = uploads.reduce((sum, u) => sum + (u.files?.length || 0), 0);
    const response: UploadStatsResponse = { totalUploads, totalImages };
    res.status(200).json(response);
  } catch (err) {
    console.error("Error getting upload stats:", err);
    res.status(500).json({ totalUploads: 0, totalImages: 0 } as UploadStatsResponse);
  }
};

export const handleGetMLImages: RequestHandler = async (_req, res) => {
  try {
    const uploads = await readUploads();
    const images: MLImageData[] = [];

    for (const upload of uploads) {
      for (const file of upload.files) {
        images.push({
          uploadId: upload.id,
          fileId: file.id,
          absolutePath: file.absolutePath,
          relativePath: file.path,
          metadata: {
            constructionType: upload.constructionType,
            siteLocation: upload.siteLocation,
            supervisorName: upload.supervisorName,
            uploadDate: upload.uploadDate,
            notes: upload.notes,
            createdAt: upload.createdAt,
          },
        });
      }
    }

    const response: MLImagesResponse = { images, total: images.length };
    res.status(200).json(response);
  } catch (err) {
    console.error("Error getting ML images:", err);
    res.status(500).json({ images: [], total: 0 } as MLImagesResponse);
  }
};

export const handleGetImagesByUploadId: RequestHandler = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const uploads = await readUploads();
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) {
      return res.status(404).json({ images: [], total: 0 } as MLImagesResponse);
    }

    const images: MLImageData[] = upload.files.map(f => ({
      uploadId: upload.id,
      fileId: f.id,
      absolutePath: f.absolutePath,
      relativePath: f.path,
      metadata: {
        constructionType: upload.constructionType,
        siteLocation: upload.siteLocation,
        supervisorName: upload.supervisorName,
        uploadDate: upload.uploadDate,
        notes: upload.notes,
        createdAt: upload.createdAt,
      },
    }));

    const response: MLImagesResponse = { images, total: images.length };
    res.status(200).json(response);
  } catch (err) {
    console.error("Error getting images by upload id:", err);
    res.status(500).json({ images: [], total: 0 } as MLImagesResponse);
  }
};

// Export multer
export { upload };
