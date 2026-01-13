"use client";
import { useState, useRef, useEffect } from "react";
import {
  Folder,
  File,
  FileImage,
  FileText,
  FileArchive,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types/file";

interface FileTableProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (file: FileItem | null) => void;
  onNavigateToFolder?: (folderName: string) => void;
  editingFileId: string | null;
  onStartRename: (file: FileItem) => void;
  onConfirmRename: (file: FileItem, newName: string) => void;
  onCancelRename: () => void;
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
  editingFileId,
  onStartRename,
  onConfirmRename,
  onCancelRename,
}: FileTableProps) {
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingFileId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingFileId]);

  const handleFolderClick = (e: React.MouseEvent, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigateToFolder?.(folderName);
  };

  const handleStartRename = (file: FileItem) => {
    setEditingName(file.name);
    onStartRename(file);
  };

  return (
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
          {files.map((file) => (
            <TableRow
              key={file.id}
              className={cn(
                "cursor-pointer",
                selectedFileId === file.id && "bg-accent"
              )}
              onClick={() =>
                onSelectFile(selectedFileId === file.id ? null : file)
              }
            >
              <TableCell>
                {editingFileId === file.id ? (
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <Input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onConfirmRename(file, editingName);
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          onCancelRename();
                        }
                      }}
                      onBlur={() => onCancelRename()}
                      className="h-7 w-64"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : file.type === "folder" ? (
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(file);
                      }}
                    >
                      <Pencil className="mr-2 size-4" />
                      Rename
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
