export const APP_NAME = "TrainDrop";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const MAX_VIDEO_SIZE_MB = 500; // 500 MB — must match Supabase Storage "max upload size" setting
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
  "video/x-msvideo", // .avi
];

export const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi"];

export const MODULE_STATUS_LABELS = {
  processing: "Processing",
  ready: "Ready",
  published: "Published",
  error: "Error",
} as const;

