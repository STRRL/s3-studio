export type FileType = "file" | "folder";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  sizeBytes?: number;
  lastModified: Date;
  mimeType?: string;
  storageClass?: string;
  etag?: string;
  isPublic: boolean;
  keyPath: string;
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  isFolder: boolean;
}
