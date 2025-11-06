import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleSaveUpload, handleGetUploadHistory, handleGetMLImages, handleGetImagesByUploadId, upload } from "./routes/upload";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded images statically
  const uploadsDir = path.join(process.cwd(), "server/data/uploads");
  app.use("/api/uploads", express.static(uploadsDir));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Upload routes
  app.post("/api/upload", upload.array("files"), handleSaveUpload);
  app.get("/api/upload/history", handleGetUploadHistory);
  
  // ML model routes - get images for training/inference
  app.get("/api/ml/images", handleGetMLImages);
  app.get("/api/ml/images/:uploadId", handleGetImagesByUploadId);

  return app;
}
