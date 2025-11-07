import type { Request, Response } from "express";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import fs from "fs";

// Keep a single running process reference
let webcamProc: ChildProcessWithoutNullStreams | null = null;

const ML_ALERTS_PATH = path.resolve(__dirname, "../data/ml_alerts.json");
const INFERENCES_DIR = path.resolve(__dirname, "../../inferences");
const WEBCAM_SCRIPT = path.join(INFERENCES_DIR, "webcam.py");

function ensureAlertsFile() {
  if (!fs.existsSync(ML_ALERTS_PATH)) {
    fs.writeFileSync(ML_ALERTS_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

export function handleStartWebcam(req: Request, res: Response) {
  try {
    ensureAlertsFile();

    if (webcamProc) {
      return res.json({ started: true, message: "Webcam ML already running" });
    }

    // Spawn python process running webcam.py
    // Use python3; if venv is needed, adjust accordingly
    webcamProc = spawn("python3", [WEBCAM_SCRIPT], {
      cwd: INFERENCES_DIR,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    webcamProc.stdout.on("data", (data) => {
      const msg = data.toString();
      // Optionally log for debugging
      // console.log("[webcam.py]", msg.trim());
    });

    webcamProc.stderr.on("data", (data) => {
      const msg = data.toString();
      console.error("[webcam.py:err]", msg.trim());
    });

    webcamProc.on("exit", (code) => {
      console.log("webcam.py exited with code", code);
      webcamProc = null;
    });

    return res.json({ started: true, message: "Webcam ML started" });
  } catch (err: any) {
    console.error("Failed to start webcam ML:", err);
    return res.status(500).json({ started: false, error: String(err?.message || err) });
  }
}

export function handleStopWebcam(_req: Request, res: Response) {
  try {
    if (webcamProc) {
      webcamProc.kill("SIGTERM");
      webcamProc = null;
      return res.json({ stopped: true });
    }
    return res.json({ stopped: false, message: "No running webcam ML" });
  } catch (err: any) {
    return res.status(500).json({ stopped: false, error: String(err?.message || err) });
  }
}

export function handleGetMlAlerts(_req: Request, res: Response) {
  try {
    ensureAlertsFile();
    const raw = fs.readFileSync(ML_ALERTS_PATH, "utf-8");
    const alerts = JSON.parse(raw);
    return res.json({ alerts });
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}