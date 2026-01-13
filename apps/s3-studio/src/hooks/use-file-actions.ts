import { useCallback } from "react";
import type { S3ClientWrapper } from "@/lib/types";
import type { FileItem } from "@/types/file";

export interface FileActions {
  downloadFile: (file: FileItem) => Promise<void>;
  deleteFile: (file: FileItem) => Promise<void>;
  renameFile: (file: FileItem, newName: string) => Promise<void>;
  copyPath: (file: FileItem) => Promise<void>;
  refresh: () => void;
  openFolder: (file: FileItem) => void;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
}

export interface UseFileActionsProps {
  client: S3ClientWrapper | null;
  bucket: string;
  currentPath: string[];
  onRefresh: () => void;
  onNavigateToFolder: (folderName: string) => void;
}

export function useFileActions({
  client,
  bucket,
  currentPath,
  onRefresh,
  onNavigateToFolder,
}: UseFileActionsProps): FileActions {
  const getCurrentPathPrefix = useCallback(() => {
    return currentPath.length > 0 ? currentPath.join("/") + "/" : "";
  }, [currentPath]);

  const downloadFile = useCallback(
    async (file: FileItem) => {
      if (!client || file.type === "folder") return;

      try {
        const data = await client.read(file.keyPath);
        const blob = new Blob([new Uint8Array(data).buffer as ArrayBuffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to download file:", err);
        throw err;
      }
    },
    [client]
  );

  const deleteFile = useCallback(
    async (file: FileItem) => {
      if (!client) return;

      try {
        if (file.type === "folder") {
          const folderPath = file.keyPath.endsWith("/")
            ? file.keyPath
            : file.keyPath + "/";
          const entries = await client.list(folderPath);

          for (const entry of entries) {
            await client.delete(entry.path);
          }

          await client.delete(folderPath);
        } else {
          await client.delete(file.keyPath);
        }
        onRefresh();
      } catch (err) {
        console.error("Failed to delete file:", err);
        throw err;
      }
    },
    [client, onRefresh]
  );

  const renameFile = useCallback(
    async (file: FileItem, newName: string) => {
      if (!client) return;

      try {
        const pathPrefix = getCurrentPathPrefix();

        if (file.type === "folder") {
          const oldFolderPath = file.keyPath.endsWith("/")
            ? file.keyPath
            : file.keyPath + "/";
          const newFolderPath = pathPrefix + newName + "/";

          const entries = await client.list(oldFolderPath);

          for (const entry of entries) {
            const relativePath = entry.path.slice(oldFolderPath.length);
            const newPath = newFolderPath + relativePath;
            const data = await client.read(entry.path);
            await client.write(newPath, data);
            await client.delete(entry.path);
          }

          await client.write(newFolderPath, new Uint8Array(0));
          await client.delete(oldFolderPath);
        } else {
          const newPath = pathPrefix + newName;
          const data = await client.read(file.keyPath);
          await client.write(newPath, data);
          await client.delete(file.keyPath);
        }
        onRefresh();
      } catch (err) {
        console.error("Failed to rename file:", err);
        throw err;
      }
    },
    [client, getCurrentPathPrefix, onRefresh]
  );

  const copyPath = useCallback(
    async (file: FileItem) => {
      const s3Uri = `s3://${bucket}/${file.keyPath}`;
      try {
        await navigator.clipboard.writeText(s3Uri);
      } catch (err) {
        console.error("Failed to copy path:", err);
        throw err;
      }
    },
    [bucket]
  );

  const refresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const openFolder = useCallback(
    (file: FileItem) => {
      if (file.type === "folder") {
        onNavigateToFolder(file.name);
      }
    },
    [onNavigateToFolder]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!client) return;

      const fileArray = Array.from(files);
      const pathPrefix = getCurrentPathPrefix();

      try {
        for (const file of fileArray) {
          const arrayBuffer = await file.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          const filePath = pathPrefix + file.name;
          await client.write(filePath, data);
        }
        onRefresh();
      } catch (err) {
        console.error("Failed to upload files:", err);
        throw err;
      }
    },
    [client, getCurrentPathPrefix, onRefresh]
  );

  const createFolder = useCallback(
    async (name: string) => {
      if (!client) return;

      try {
        const pathPrefix = getCurrentPathPrefix();
        const folderPath = pathPrefix + name + "/";
        await client.write(folderPath, new Uint8Array(0));
        onRefresh();
      } catch (err) {
        console.error("Failed to create folder:", err);
        throw err;
      }
    },
    [client, getCurrentPathPrefix, onRefresh]
  );

  return {
    downloadFile,
    deleteFile,
    renameFile,
    copyPath,
    refresh,
    openFolder,
    uploadFiles,
    createFolder,
  };
}
