"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Download,
  FolderOpen,
  Pencil,
  Trash2,
  Copy,
  Upload,
  FolderPlus,
  RefreshCw,
} from "lucide-react";
import type { FileItem } from "@/types/file";
import type { FileActions } from "@/hooks/use-file-actions";

interface FileContextMenuProps {
  children: React.ReactNode;
  file?: FileItem;
  actions: FileActions;
  onRenameRequest: (file: FileItem) => void;
  onDeleteRequest: (file: FileItem) => void;
  onUploadRequest: () => void;
  onNewFolderRequest: () => void;
}

function isMac() {
  return typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function FileContextMenu({
  children,
  file,
  actions,
  onRenameRequest,
  onDeleteRequest,
  onUploadRequest,
  onNewFolderRequest,
}: FileContextMenuProps) {
  const modKey = isMac() ? "⌘" : "Ctrl+";

  if (!file) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={onUploadRequest}>
            <Upload className="size-4" />
            Upload
          </ContextMenuItem>
          <ContextMenuItem onClick={onNewFolderRequest}>
            <FolderPlus className="size-4" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={actions.refresh}>
            <RefreshCw className="size-4" />
            Refresh
            <ContextMenuShortcut>{modKey}R</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  if (file.type === "folder") {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => actions.openFolder(file)}>
            <FolderOpen className="size-4" />
            Open
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onRenameRequest(file)}>
            <Pencil className="size-4" />
            Rename
            <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onClick={() => onDeleteRequest(file)}
          >
            <Trash2 className="size-4" />
            Delete
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => actions.copyPath(file)}>
            <Copy className="size-4" />
            Copy Path
            <ContextMenuShortcut>{modKey}C</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => actions.downloadFile(file)}>
          <Download className="size-4" />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onRenameRequest(file)}>
          <Pencil className="size-4" />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDeleteRequest(file)}
        >
          <Trash2 className="size-4" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => actions.copyPath(file)}>
          <Copy className="size-4" />
          Copy Path
          <ContextMenuShortcut>{modKey}C</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
