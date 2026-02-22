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
  createDir: (path: string) => Promise<void>;
  free: () => void;
}

export interface S3Profile {
  id: string;
  name: string;
  config: S3Config;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStore {
  profiles: Record<string, S3Profile>;
  profileOrder: string[];
  activeProfileId: string | null;
}

export type ProfileImportConflictStrategy = 'overwrite' | 'skip' | 'rename';

export interface ProfileExportItem {
  name: string;
  config: S3Config;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileExportPayload {
  version: number;
  exportedAt: string;
  includeSecrets: boolean;
  profiles: ProfileExportItem[];
}

export interface ProfileImportResult {
  imported: number;
  overwritten: number;
  skipped: number;
  renamed: number;
}

export type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export interface ConnectionTestResult {
  status: ConnectionStatus;
  message?: string;
  testedAt?: string;
}
