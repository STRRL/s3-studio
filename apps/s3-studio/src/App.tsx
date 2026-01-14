"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FolderOpen, Loader2, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FileTable } from "@/components/files/file-table";
import { FileBreadcrumb } from "@/components/files/file-breadcrumb";
import { FileToolbar } from "@/components/files/file-toolbar";
import { FilePropertiesPanel } from "@/components/files/file-properties-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileFormModal } from "@/components/profiles/profile-form-modal";
import { useS3Client } from "@/hooks/use-s3-client";
import { useProfileStore } from "@/stores/profile-store";
import type { S3Config, FileEntry } from "@/lib/types";
import type { FileItem } from "@/types/file";

function convertToFileItem(entry: FileEntry, index: number): FileItem {
  return {
    id: `${index}-${entry.path}`,
    name: entry.name,
    type: entry.is_dir ? "folder" : "file",
    size: entry.is_dir ? undefined : formatBytes(entry.size),
    sizeBytes: entry.size,
    lastModified: entry.last_modified ? new Date(entry.last_modified) : new Date(),
    isPublic: false,
    keyPath: entry.path,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function App() {
  const {
    profiles,
    activeProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    getActiveConfig,
  } = useProfileStore();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [searchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const config = getActiveConfig();
  const prevActiveProfileIdRef = useRef(activeProfileId);

  const { client, loading: clientLoading, error: clientError } = useS3Client(config);

  const hasProfiles = Object.keys(profiles).length > 0;

  useEffect(() => {
    if (!hasProfiles) {
      setProfileModalOpen(true);
    }
  }, [hasProfiles]);

  useEffect(() => {
    if (prevActiveProfileIdRef.current !== activeProfileId) {
      setCurrentPath([]);
      setFiles([]);
      setSelectedFile(null);
      setListError(null);
      prevActiveProfileIdRef.current = activeProfileId;
    }
  }, [activeProfileId]);

  const fetchFiles = useCallback(async () => {
    if (!client) return;

    setListLoading(true);
    setListError(null);

    try {
      const path = currentPath.length > 0 ? currentPath.join("/") + "/" : "/";
      const entries = await client.list(path);
      const fileItems = entries.map((entry, index) => convertToFileItem(entry, index));
      setFiles(fileItems);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to list files");
      setFiles([]);
    } finally {
      setListLoading(false);
    }
  }, [client, currentPath]);

  useEffect(() => {
    if (client) {
      fetchFiles();
    }
  }, [client, fetchFiles]);

  const handleAddProfile = () => {
    setEditingProfileId(null);
    setProfileModalOpen(true);
  };

  const handleEditProfile = (profileId: string) => {
    setEditingProfileId(profileId);
    setProfileModalOpen(true);
  };

  const handleProfileSubmit = (name: string, newConfig: S3Config) => {
    if (editingProfileId) {
      updateProfile(editingProfileId, { name, ...newConfig });
    } else {
      const profile = addProfile(name, newConfig);
      setActiveProfile(profile.id);
    }
    setCurrentPath([]);
  };

  const handleProfileDelete = () => {
    if (editingProfileId) {
      deleteProfile(editingProfileId);
      setEditingProfileId(null);
    }
  };

  const handleDisconnect = () => {
    setActiveProfile(null);
    setFiles([]);
    setSelectedFile(null);
  };

  const handleNavigateToFolder = (folderName: string) => {
    setCurrentPath((prev) => [...prev, folderName]);
    setSelectedFile(null);
  };

  const handleNavigateTo = (pathIndex: number) => {
    if (pathIndex < 0) {
      setCurrentPath([]);
    } else {
      setCurrentPath((prev) => prev.slice(0, pathIndex + 1));
    }
    setSelectedFile(null);
  };

  const getBreadcrumbs = (): { label: string; href?: string }[] => {
    if (!config) return [{ label: "S3 Studio" }];

    const crumbs: { label: string; href?: string }[] = [{ label: config.bucket, href: "#" }];
    currentPath.forEach((segment, index) => {
      crumbs.push({
        label: segment,
        href: index === currentPath.length - 1 ? undefined : "#",
      });
    });
    return crumbs;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoadPreview = useCallback(async (path: string): Promise<Uint8Array> => {
    if (!client) {
      throw new Error("No client available");
    }
    return client.read(path);
  }, [client]);

  const handleStartRename = useCallback((file: FileItem) => {
    setEditingFileId(file.id);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingFileId(null);
  }, []);

  const handleConfirmRename = useCallback(async (file: FileItem, newName: string) => {
    if (!client) return;

    const trimmedName = newName.trim();

    if (!trimmedName || trimmedName === file.name) {
      setEditingFileId(null);
      return;
    }

    if (trimmedName.includes("/") || trimmedName.includes("\\")) {
      alert("File name cannot contain / or \\");
      return;
    }

    try {
      const parentPath = file.keyPath.substring(0, file.keyPath.lastIndexOf(file.name));
      const newPath = parentPath + trimmedName + (file.type === "folder" ? "/" : "");

      await client.rename(file.keyPath, newPath);
      setEditingFileId(null);
      await fetchFiles();
    } catch (err) {
      alert(`Rename failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [client, fetchFiles]);

  const editingProfile = editingProfileId ? profiles[editingProfileId] : null;

  const isLoading = clientLoading || listLoading;
  const error = clientError || (listError ? new Error(listError) : null);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onAddProfile={handleAddProfile} onEditProfile={handleEditProfile} />

      <ProfileFormModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        editingProfile={editingProfile}
        onSubmit={handleProfileSubmit}
        onDelete={editingProfileId ? handleProfileDelete : undefined}
      />

      <div className="ml-64 flex flex-1 flex-col overflow-hidden">
        <Header breadcrumbs={getBreadcrumbs()} />

        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {!config ? (
              <EmptyState
                icon={FolderOpen}
                title="No connection selected"
                description="Select a connection from the sidebar or add a new one to get started."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FileBreadcrumb bucketId={config.bucket} path={currentPath} onNavigateTo={handleNavigateTo} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProfile(activeProfileId!)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="text-sm text-destructive hover:text-destructive/80"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                <FileToolbar viewMode={viewMode} onViewModeChange={setViewMode} />

                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="size-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-1 text-sm text-destructive">{error.message}</p>
                  </div>
                )}

                {!isLoading && !error && filteredFiles.length > 0 && (
                  <FileTable
                    files={filteredFiles}
                    selectedFileId={selectedFile?.id ?? null}
                    onSelectFile={setSelectedFile}
                    onNavigateToFolder={handleNavigateToFolder}
                    editingFileId={editingFileId}
                    onStartRename={handleStartRename}
                    onConfirmRename={handleConfirmRename}
                    onCancelRename={handleCancelRename}
                  />
                )}

                {!isLoading && !error && filteredFiles.length === 0 && (
                  <EmptyState
                    icon={FolderOpen}
                    title="No files"
                    description={
                      searchQuery
                        ? "No files match your search."
                        : "This folder is empty. Upload some files to get started."
                    }
                  />
                )}
              </div>
            )}
          </div>

          {selectedFile && (
            <FilePropertiesPanel
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onLoadPreview={handleLoadPreview}
            />
          )}
        </main>
      </div>
    </div>
  );
}
