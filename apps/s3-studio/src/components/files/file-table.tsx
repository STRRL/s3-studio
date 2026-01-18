"use client";

import {
  Folder,
  File,
  FileImage,
  FileText,
  FileArchive,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileContextMenu } from "@/components/files/file-context-menu";
import type { FileItem } from "@/types/file";
import type { FileActions } from "@/hooks/use-file-actions";

interface FileTableProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (file: FileItem | null) => void;
  onNavigateToFolder?: (folderName: string) => void;
  actions?: FileActions;
  onRenameRequest?: (file: FileItem) => void;
  onDeleteRequest?: (file: FileItem) => void;
  onUploadRequest?: () => void;
  onNewFolderRequest?: () => void;
}

function getFileIcon(file: FileItem) {
  if (file.type === "folder") {
    return <Folder className="size-4 text-blue-500" />;
  }

  const mimeType = file.mimeType || "";
  if (mimeType.startsWith("image/")) {
    return <FileImage className="size-4 text-emerald-500" />;
  }
  if (mimeType.includes("pdf") || mimeType.includes("document")) {
    return <FileText className="size-4 text-red-500" />;
  }
  if (mimeType.includes("zip") || mimeType.includes("archive")) {
    return <FileArchive className="size-4 text-amber-500" />;
  }
  return <File className="size-4 text-slate-500" />;
}

function formatDate(date: Date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FileTable({
  files,
  selectedFileId,
  onSelectFile,
  onNavigateToFolder,
  actions,
  onRenameRequest,
  onDeleteRequest,
  onUploadRequest,
  onNewFolderRequest,
}: FileTableProps) {
  const handleFolderClick = (e: React.MouseEvent, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigateToFolder?.(folderName);
  };

  const renderTableContent = () => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">Name</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const rowContent = (
              <TableRow
                key={file.id}
                className={cn(selectedFileId === file.id && "bg-accent")}
                onClick={() =>
                  onSelectFile(selectedFileId === file.id ? null : file)
                }
              >
                <TableCell>
                  {file.type === "folder" ? (
                    <button
                      type="button"
                      className="flex items-center gap-3 font-medium hover:underline text-left"
                      onClick={(e) => handleFolderClick(e, file.name)}
                    >
                      {getFileIcon(file)}
                      {file.name}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 font-medium">
                      {getFileIcon(file)}
                      {file.name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(file.lastModified)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.size || "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFile(file);
                    }}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );

            if (actions && onRenameRequest && onDeleteRequest && onUploadRequest && onNewFolderRequest) {
              return (
                <FileContextMenu
                  key={file.id}
                  file={file}
                  actions={actions}
                  onRenameRequest={onRenameRequest}
                  onDeleteRequest={onDeleteRequest}
                  onUploadRequest={onUploadRequest}
                  onNewFolderRequest={onNewFolderRequest}
                >
                  {rowContent}
                </FileContextMenu>
              );
            }

            return rowContent;
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (actions && onRenameRequest && onDeleteRequest && onUploadRequest && onNewFolderRequest) {
    return (
      <FileContextMenu
        actions={actions}
        onRenameRequest={onRenameRequest}
        onDeleteRequest={onDeleteRequest}
        onUploadRequest={onUploadRequest}
        onNewFolderRequest={onNewFolderRequest}
      >
        {renderTableContent()}
      </FileContextMenu>
    );
  }

  return renderTableContent();
}
