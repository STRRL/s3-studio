export type PreviewType =
  | "image"
  | "text"
  | "pdf"
  | "video"
  | "audio"
  | "unsupported";

export interface FileTypeInfo {
  previewType: PreviewType;
  mimeType: string;
  language?: string;
}

const TEXT_EXTENSIONS: Record<string, string> = {
  ".txt": "text",
  ".md": "markdown",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".xml": "xml",
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".jsx": "jsx",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "scss",
  ".less": "less",
  ".sh": "shell",
  ".bash": "bash",
  ".zsh": "shell",
  ".sql": "sql",
  ".toml": "toml",
  ".ini": "ini",
  ".env": "shell",
  ".gitignore": "text",
  ".dockerignore": "text",
};

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
];

const VIDEO_EXTENSIONS = [".mp4", ".webm"];

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a"];

const PDF_EXTENSIONS = [".pdf"];

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function getImageMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".ico": "image/x-icon",
  };
  return mimeTypes[ext] || "image/png";
}

function getVideoMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "video/mp4";
}

function getAudioMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
  };
  return mimeTypes[ext] || "audio/mpeg";
}

export function getFileTypeInfo(filename: string): FileTypeInfo {
  const ext = getExtension(filename);

  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { previewType: "image", mimeType: getImageMimeType(ext) };
  }

  if (PDF_EXTENSIONS.includes(ext)) {
    return { previewType: "pdf", mimeType: "application/pdf" };
  }

  if (VIDEO_EXTENSIONS.includes(ext)) {
    return { previewType: "video", mimeType: getVideoMimeType(ext) };
  }

  if (AUDIO_EXTENSIONS.includes(ext)) {
    return { previewType: "audio", mimeType: getAudioMimeType(ext) };
  }

  if (ext in TEXT_EXTENSIONS) {
    return {
      previewType: "text",
      mimeType: "text/plain",
      language: TEXT_EXTENSIONS[ext],
    };
  }

  return { previewType: "unsupported", mimeType: "application/octet-stream" };
}

export function isPreviewable(previewType: PreviewType): boolean {
  return previewType !== "unsupported";
}

export function canPreviewFile(filename: string): boolean {
  const { previewType } = getFileTypeInfo(filename);
  return isPreviewable(previewType);
}
