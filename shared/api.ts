/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Upload data types
 */
export interface UploadedFileData {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string; // relative path for serving (e.g., "uploads/upload-123/image.jpg")
  absolutePath: string; // absolute file system path for ML model access
}

export interface UploadEntry {
  id: string;
  constructionType: string;
  siteLocation: string;
  supervisorName: string;
  uploadDate: string;
  notes: string;
  files: UploadedFileData[];
  createdAt: string; // ISO timestamp
}

export interface UploadHistoryResponse {
  uploads: UploadEntry[];
}

export interface MLImageData {
  uploadId: string;
  fileId: string;
  absolutePath: string;
  relativePath: string;
  metadata: {
    constructionType: string;
    siteLocation: string;
    supervisorName: string;
    uploadDate: string;
    notes: string;
    createdAt: string;
  };
}

export interface MLImagesResponse {
  images: MLImageData[];
  total: number;
}

// Note: SaveUploadRequest is now sent as FormData, not JSON
// Fields: constructionType, siteLocation, supervisorName, uploadDate, notes, files (multiple files)

export interface SaveUploadResponse {
  success: boolean;
  id: string;
  message: string;
}
