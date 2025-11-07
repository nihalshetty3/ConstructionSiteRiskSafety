import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

export default function CameraAccessButton(): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const webcamRef = useRef<Webcam | null>(null);
  const navigate = useNavigate();

  const closeCamera = () => {
    // stop ML webcam if running and navigate back to home
    fetch("/api/ml/stop-webcam", { method: "POST" }).catch(() => {});
    navigate("/");
  };

  const captureAndAnalyze = useCallback(async () => {
    try {
      setIsLoading(true);
      // Start the backend Python webcam ML process
      const resp = await fetch("/api/ml/start-webcam");
      const data = await resp.json();
      setAnalysisResult(data?.message || "Webcam ML started");
    } catch (err) {
      setAnalysisResult(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex justify-center">
      <div style={{ width: "75%", margin: "0 auto" }} className="glass-card p-4 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-white mb-3">Live Camera Feed</h3>

        <div className="w-full flex justify-center">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode: "environment" }}
            className="rounded border border-white/10 w-full h-auto"
            style={{ width: "100%" }}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={captureAndAnalyze}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-neon-orange text-black font-semibold disabled:opacity-60"
          >
            Capture and Analyze
          </button>

          <button onClick={closeCamera} className="px-4 py-2 rounded bg-red-600 text-white">
            Close Camera
          </button>
        </div>

        {isLoading && <div className="text-sm text-gray-300 mt-2">Analyzing...</div>}
        {analysisResult && (
          <div className="text-sm text-gray-300 mt-2">Result: {String(analysisResult)}</div>
        )}
      </div>
    </div>
  );
}
