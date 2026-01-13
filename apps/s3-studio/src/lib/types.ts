export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
  bucket: string;
  endpoint?: string;
}

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  last_modified?: string;
}

export interface S3ClientWrapper {
  list: (path: string) => Promise<FileEntry[]>;
  read: (path: string) => Promise<Uint8Array>;
  write: (path: string, data: Uint8Array) => Promise<void>;
  delete: (path: string) => Promise<void>;
  stat: (path: string) => Promise<FileEntry>;
  rename: (from: string, to: string) => Promise<void>;
  free: () => void;
}
