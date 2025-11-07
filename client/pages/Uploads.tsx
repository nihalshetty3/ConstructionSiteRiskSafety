import { useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
  Upload,
  X,
  FileImage,
  Calendar,
  MapPin,
  User,
  Building2,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { SaveUploadResponse } from "@shared/api";
import { UploadAlertFeed } from "@/components/UploadAlertField";

// --- Component Interfaces ---
interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

export default function Uploads() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [constructionType, setConstructionType] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [uploadDate, setUploadDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [submitStep, setSubmitStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // ✅ FIXED handleSubmit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!constructionType || !siteLocation || !supervisorName) {
        setSubmitStatus({
          type: "error",
          message:
            "Please fill in all required fields: construction type, site location, and supervisor name.",
        });
        return;
      }
      if (files.length === 0) {
        setSubmitStatus({
          type: "error",
          message: "Please upload at least one image.",
        });
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);
      setSubmitStep("Uploading files...");

      try {
        const formData = new FormData();
        formData.append("constructionType", constructionType);
        formData.append("siteLocation", siteLocation);
        formData.append("supervisorName", supervisorName);
        formData.append("uploadDate", uploadDate);
        formData.append("notes", notes);

        files.forEach((file) => {
          formData.append("files", file.file);
        });

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data: SaveUploadResponse = await response.json();

        if (data.success) {
          setSubmitStatus({
            type: "success",
            message: "Upload saved successfully!",
          });

          // reset
          setFiles([]);
          setConstructionType("");
          setSiteLocation("");
          setSupervisorName("");
          setUploadDate(new Date().toISOString().split("T")[0]);
          setNotes("");

          if (fileInputRef.current) fileInputRef.current.value = "";

          setTimeout(() => setSubmitStatus(null), 4000);
        } else {
          setSubmitStatus({
            type: "error",
            message: data.message || "Failed to save upload.",
          });
        }
      } catch (err) {
        console.error("Error submitting:", err);
        setSubmitStatus({
          type: "error",
          message: "An error occurred while saving the upload.",
        });
      } finally {
        setIsSubmitting(false);
        setSubmitStep("");
      }
    },
    [files, constructionType, siteLocation, supervisorName, uploadDate, notes]
  );

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Upload Site Data</h1>
            <p className="text-gray-400 mt-1">Upload images or videos from your site for AI safety analysis.</p>
          </div>

          {submitStatus && (
            <div className={`mb-6 p-4 rounded-md ${submitStatus.type === 'success' ? 'bg-green-900/40 border border-green-700' : 'bg-red-900/40 border border-red-700'}`}>
              <p className="text-sm text-white">{submitStatus.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Site Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Construction Type</label>
                    <input value={constructionType} onChange={(e) => setConstructionType(e.target.value)} className="w-full mt-1 p-3 rounded bg-white/3 text-black placeholder-gray-400" placeholder="e.g. Residential, Commercial" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Site Location</label>
                    <input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} className="w-full mt-1 p-3 rounded bg-white/3 text-black placeholder-gray-400" placeholder="City, Address or GPS" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Supervisor Name</label>
                    <input value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} className="w-full mt-1 p-3 rounded bg-white/3 text-black placeholder-gray-400" placeholder="Site Supervisor" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Upload Date</label>
                    <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} className="w-full mt-1 p-3 rounded bg-white/3 text-black" aria-label="Upload date" title="Upload date" />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs text-gray-400">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 p-3 rounded bg-white/3 text-black placeholder-gray-400" rows={4} aria-label="Notes" title="Notes" placeholder="Optional notes about the upload" />
                </div>
              </div>

              {/* Alerts from uploads */}
              <UploadAlertFeed />
            </div>

            {/* Right: Upload Area + Previews */}
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 rounded-lg border-2 ${isDragging ? 'border-neon-cyan' : 'border-white/10'} bg-white/2`}>
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <FileImage className="w-12 h-12 text-neon-cyan mb-4" />
                  <p className="text-white font-medium">Drag & drop images or videos here</p>
                  <p className="text-gray-400 text-sm mt-2">Or click to select files</p>

                  <input ref={fileInputRef} onChange={handleFileInputChange} type="file" accept="image/*,video/*" multiple className="hidden" aria-label="Select files to upload" title="Select files to upload" />

                  <div className="mt-4">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded bg-neon-orange text-black font-semibold">Choose files</button>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 max-h-96 overflow-y-auto">
                <h3 className="text-sm text-gray-300 font-semibold mb-3">Selected Files ({files.length})</h3>
                {files.length === 0 ? (
                  <p className="text-gray-500 text-sm">No files selected yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {files.map((f) => (
                      <div key={f.id} className="relative rounded overflow-hidden bg-white/3">
                        <img src={f.preview} alt={f.file.name} className="w-full h-28 object-cover" />
                        <button type="button" onClick={() => removeFile(f.id)} className="absolute top-2 right-2 bg-black/60 p-1 rounded text-white" aria-label={`Remove ${f.file.name}`} title={`Remove ${f.file.name}`}>
                          <X size={16} />
                        </button>
                        <div className="p-2 text-xs text-gray-300">{f.file.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative px-6 py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-neon-orange to-amber-600 hover:from-neon-orange hover:to-amber-500 transition-all duration-300 glow-strong-orange hover:glow-neon-orange overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        {submitStep || "Saving..."}
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                        Submit Upload
                      </>
                    )}
                  </span>
                </button>
              </div>

            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
