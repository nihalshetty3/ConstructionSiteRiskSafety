import { useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Upload, X, FileImage, Calendar, MapPin, User, Building2, FileText } from "lucide-react";

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
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log({
      files,
      constructionType,
      siteLocation,
      supervisorName,
      uploadDate,
      notes,
    });
    // Reset form or show success message
  }, [files, constructionType, siteLocation, supervisorName, uploadDate, notes]);

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 px-4 lg:px-8 py-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-neon-orange/5 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-gradient-to-t from-neon-cyan/5 via-transparent to-transparent blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <Upload className="w-10 h-10 text-neon-orange" />
              Upload Site Data
            </h1>
            <p className="text-gray-400 text-lg">
              Submit construction site images and details for AI-based risk detection.
            </p>
          </div>

          {/* Upload Form Card */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
              {/* Image Upload Section */}
              <div className="mb-8">
                <label className="block text-white font-semibold mb-4 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-neon-orange" />
                  Site Images
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                    className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragging
                      ? "border-neon-orange bg-neon-orange/10 glow-neon-orange"
                      : "border-white/20 hover:border-neon-orange/50 hover:bg-white/5"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-neon-orange/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-neon-orange" />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">
                        {isDragging ? "Drop images here" : "Drag and drop images here"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        or <span className="text-neon-orange hover:text-neon-orange/80 underline">browse files</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Supports multiple images (PNG, JPG, JPEG)</p>
                    </div>
                  </div>
                </div>

                {/* Image Preview Section */}
                {files.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="relative group glass-card-sm p-2 animate-slide-in"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.id);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 truncate" title={file.file.name}>
                          {file.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Construction Type */}
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-neon-orange" />
                    Construction Type
                  </label>
                  <select
                    value={constructionType}
                    onChange={(e) => setConstructionType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-neon-orange focus:ring-2 focus:ring-neon-orange/20 focus:outline-none transition-all duration-300 hover:border-white/20"
                  >
                    <option value="" className="bg-gray-900">Select construction type</option>
                    <option value="residential" className="bg-gray-900">Residential</option>
                    <option value="commercial" className="bg-gray-900">Commercial</option>
                    <option value="bridge" className="bg-gray-900">Bridge</option>
                    <option value="roadwork" className="bg-gray-900">Roadwork</option>
                    <option value="industrial" className="bg-gray-900">Industrial</option>
                  </select>
                </div>

                {/* Site Location */}
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-neon-orange" />
                    Site Location
                  </label>
                  <input
                    type="text"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder="Enter site location"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-neon-orange focus:ring-2 focus:ring-neon-orange/20 focus:outline-none transition-all duration-300 hover:border-white/20"
                  />
                </div>

                {/* Supervisor Name */}
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-neon-orange" />
                    Supervisor Name
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="Enter supervisor name"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-neon-orange focus:ring-2 focus:ring-neon-orange/20 focus:outline-none transition-all duration-300 hover:border-white/20"
                  />
                </div>

                {/* Upload Date */}
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-neon-orange" />
                    Upload Date
                  </label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-neon-orange focus:ring-2 focus:ring-neon-orange/20 focus:outline-none transition-all duration-300 hover:border-white/20"
                  />
                </div>

                {/* Notes / Description */}
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-neon-orange" />
                    Notes / Description
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes or description..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-neon-orange focus:ring-2 focus:ring-neon-orange/20 focus:outline-none transition-all duration-300 hover:border-white/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end animate-fade-in" style={{ animationDelay: "200ms" }}>
              <button
                type="submit"
                className="group relative px-8 py-4 rounded-lg font-semibold text-black bg-gradient-to-r from-neon-orange to-amber-600 hover:from-neon-orange hover:to-amber-500 transition-all duration-300 glow-strong-orange hover:glow-neon-orange overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center gap-2">
                  <Upload className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                  Submit Upload
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
