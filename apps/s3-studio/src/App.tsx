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
import { RenameDialog } from "@/components/files/rename-dialog";
import { NewFolderDialog } from "@/components/files/new-folder-dialog";
import { DeleteConfirmDialog } from "@/components/files/delete-confirm-dialog";
import { useS3Client } from "@/hooks/use-s3-client";
import { useProfileStore } from "@/stores/profile-store";
import { useFileActions } from "@/hooks/use-file-actions";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type {
  S3Config,
  FileEntry,
  ProfileImportConflictStrategy,
} from "@/lib/types";
import type { FileItem } from "@/types/file";
import { formatFileSize } from "@/lib/utils";

function convertToFileItem(entry: FileEntry, index: number): FileItem {
  return {
    id: `${index}-${entry.path}`,
    name: entry.name,
    type: entry.is_dir ? "folder" : "file",
    size: entry.is_dir ? undefined : formatFileSize(entry.size),
    sizeBytes: entry.size,
    lastModified: entry.last_modified ? new Date(entry.last_modified) : new Date(),
    isPublic: false,
    keyPath: entry.path,
  };
}

export default function App() {
  const {
    profiles,
    activeProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    exportProfiles,
    importProfiles,
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

  const config = getActiveConfig();
  const prevActiveProfileIdRef = useRef(activeProfileId);

  const [renameDialogFile, setRenameDialogFile] = useState<FileItem | null>(null);
  const [deleteDialogFile, setDeleteDialogFile] = useState<FileItem | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const pendingImportStrategyRef = useRef<ProfileImportConflictStrategy>("rename");

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

  const handleExportProfiles = useCallback(
    (includeSecrets: boolean) => {
      try {
        const payload = exportProfiles({ includeSecrets });
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `s3-studio-profiles-v${payload.version}-${includeSecrets ? "with-secrets" : "without-secrets"}-${timestamp}.json`;
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to export profiles";
        window.alert(message);
      }
    },
    [exportProfiles]
  );

  const handleImportProfiles = useCallback((strategy: ProfileImportConflictStrategy) => {
    pendingImportStrategyRef.current = strategy;
    importFileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const payload = JSON.parse(text) as unknown;
        const result = importProfiles(payload, {
          strategy: pendingImportStrategyRef.current,
        });

        window.alert(
          [
            "Profiles import completed:",
            `- Imported: ${result.imported}`,
            `- Overwritten: ${result.overwritten}`,
            `- Renamed: ${result.renamed}`,
            `- Skipped: ${result.skipped}`,
          ].join("\n")
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to import profiles";
        window.alert(`Import failed: ${message}`);
      } finally {
        if (importFileInputRef.current) {
          importFileInputRef.current.value = "";
        }
      }
    },
    [importProfiles]
  );

  const handleNavigateToFolder = useCallback((folderName: string) => {
    setCurrentPath((prev) => [...prev, folderName]);
    setSelectedFile(null);
  }, []);

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

  const actions = useFileActions({
    client,
    bucket: config?.bucket || "",
    currentPath,
    onRefresh: fetchFiles,
    onNavigateToFolder: handleNavigateToFolder,
  });

  const handleRenameRequest = useCallback((file: FileItem) => {
    setRenameDialogFile(file);
  }, []);

  const handleDeleteRequest = useCallback((file: FileItem) => {
    setDeleteDialogFile(file);
  }, []);

  const handleUploadRequest = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleNewFolderRequest = useCallback(() => {
    setNewFolderDialogOpen(true);
  }, []);

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = e.target.files;
      if (uploadedFiles && uploadedFiles.length > 0) {
        try {
          await actions.uploadFiles(uploadedFiles);
        } catch (err) {
          console.error("Upload failed:", err);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [actions]
  );

  useKeyboardShortcuts({
    enabled: !!client && !!config,
    selectedFile,
    actions,
    onRenameRequest: handleRenameRequest,
    onDeleteRequest: handleDeleteRequest,
  });

  const editingProfile = editingProfileId ? profiles[editingProfileId] : null;

  const isLoading = clientLoading || listLoading;
  const error = clientError || (listError ? new Error(listError) : null);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        onAddProfile={handleAddProfile}
        onEditProfile={handleEditProfile}
        onDisconnect={handleDisconnect}
        onExportProfiles={handleExportProfiles}
        onImportProfiles={handleImportProfiles}
        activeProfileId={activeProfileId}
      />

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
                <FileBreadcrumb bucketId={config.bucket} path={currentPath} onNavigateTo={handleNavigateTo} />

                <FileToolbar
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onUpload={handleUploadRequest}
                  onNewFolder={handleNewFolderRequest}
                  onRefresh={fetchFiles}
                />

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
                    actions={actions}
                    onRenameRequest={handleRenameRequest}
                    onDeleteRequest={handleDeleteRequest}
                    onUploadRequest={handleUploadRequest}
                    onNewFolderRequest={handleNewFolderRequest}
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
              onDownload={() => actions.downloadFile(selectedFile)}
              onDelete={() => handleDeleteRequest(selectedFile)}
              onRename={() => handleRenameRequest(selectedFile)}
            />
          )}
        </main>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={handleFileInputChange}
      />

      <input
        type="file"
        ref={importFileInputRef}
        className="hidden"
        accept="application/json,.json"
        onChange={handleImportFileChange}
      />

      <RenameDialog
        open={!!renameDialogFile}
        file={renameDialogFile}
        onRename={actions.renameFile}
        onOpenChange={(open) => {
          if (!open) setRenameDialogFile(null);
        }}
      />

      <NewFolderDialog
        open={newFolderDialogOpen}
        onCreate={actions.createFolder}
        onOpenChange={setNewFolderDialogOpen}
      />

      <DeleteConfirmDialog
        open={!!deleteDialogFile}
        file={deleteDialogFile}
        onDelete={actions.deleteFile}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogFile(null);
        }}
      />
    </div>
  );
}
