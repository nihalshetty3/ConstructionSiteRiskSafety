import { RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import {
  WorkerHealthRequest,
  WorkerHealthResponse,
  WorkerHealthEntry,
  WorkerHealthHistoryResponse,
  WorkerHealthStatsResponse,
} from "@shared/api";

// Use process.cwd() for reliable path resolution in both dev and production
const DATA_DIR = path.join(process.cwd(), "server/data");
const WORKERS_FILE = path.join(DATA_DIR, "workers.json");

// Ensure data directory exists
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Helper function to read workers from JSON file
async function readWorkers(): Promise<WorkerHealthEntry[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(WORKERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

// Helper function to write workers to JSON file
async function writeWorkers(workers: WorkerHealthEntry[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(WORKERS_FILE, JSON.stringify(workers, null, 2), "utf-8");
}

// Save worker health data
export const handleSaveWorkerHealth: RequestHandler = async (req, res) => {
  try {
    const workerData: WorkerHealthRequest = req.body;

    // Validate required fields
    if (
      !workerData.workerName ||
      !workerData.workerId ||
      !workerData.age ||
      workerData.totalHoursWorked === undefined ||
      !workerData.date ||
      !workerData.siteLocation ||
      !workerData.supervisorName
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: workerName, workerId, age, totalHoursWorked, date, siteLocation, supervisorName",
      } as WorkerHealthResponse);
    }

    // Validate health conditions
    if (!workerData.healthConditions || workerData.healthConditions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one health condition is required",
      } as WorkerHealthResponse);
    }

    // Read existing workers
    const workers = await readWorkers();

    // Create new worker health entry
    const newWorker: WorkerHealthEntry = {
      id: `worker-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      workerName: workerData.workerName,
      workerId: workerData.workerId,
      age: workerData.age,
      totalHoursWorked: workerData.totalHoursWorked,
      date: workerData.date,
      siteLocation: workerData.siteLocation,
      supervisorName: workerData.supervisorName,
      healthConditions: workerData.healthConditions,
      medications: workerData.medications || "",
      allergies: workerData.allergies || "",
      emergencyContact: workerData.emergencyContact || "",
      emergencyPhone: workerData.emergencyPhone || "",
      notes: workerData.notes || "",
      createdAt: new Date().toISOString(),
    };

    // Add to workers array
    workers.push(newWorker);

    // Write back to file
    await writeWorkers(workers);

    const response: WorkerHealthResponse = {
      success: true,
      id: newWorker.id,
      message: "Worker health record saved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error saving worker health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save worker health record",
    } as WorkerHealthResponse);
  }
};

// Get worker health history
export const handleGetWorkerHealthHistory: RequestHandler = async (_req, res) => {
  try {
    const workers = await readWorkers();

    // Sort by createdAt descending (newest first)
    workers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: WorkerHealthHistoryResponse = {
      workers,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error reading worker health history:", error);
    res.status(500).json({
      workers: [],
    } as WorkerHealthHistoryResponse);
  }
};

// Get worker health statistics
export const handleGetWorkerHealthStats: RequestHandler = async (_req, res) => {
  try {
    const workers = await readWorkers();

    // Get unique workers by workerId
    const uniqueWorkerIds = new Set(workers.map((w) => w.workerId));
    const totalWorkers = uniqueWorkerIds.size;
    const totalRecords = workers.length;

    const response: WorkerHealthStatsResponse = {
      totalWorkers,
      totalRecords,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting worker health stats:", error);
    res.status(500).json({
      totalWorkers: 0,
      totalRecords: 0,
    } as WorkerHealthStatsResponse);
  }
};

