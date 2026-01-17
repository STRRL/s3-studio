"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  Trash2,
  Pencil,
  FileText,
  FileImage,
  File,
  Folder,
  Loader2,
  Music,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FilePreviewDispatcher, FileTooLarge } from "./preview";
import { getFileTypeInfo, canPreviewFile } from "@/lib/file-types";
import { cn, PREVIEW_SIZE_LIMIT } from "@/lib/utils";
import type { FileItem } from "@/types/file";

interface FilePropertiesPanelProps {
  file: FileItem | null;
  onClose: () => void;
  onLoadPreview?: (path: string) => Promise<Uint8Array>;
  onDownload?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}

function getPreviewIcon(file: FileItem) {
  if (file.type === "folder") {
    return <Folder className="size-16 text-blue-500" />;
  }

  const { previewType } = getFileTypeInfo(file.name);

  switch (previewType) {
    case "image":
      return <FileImage className="size-16 text-emerald-500" />;
    case "pdf":
      return (
        <div className="flex size-16 items-center justify-center rounded bg-red-100">
          <span className="text-sm font-bold text-red-600">PDF</span>
        </div>
      );
    case "text":
      return <FileText className="size-16 text-blue-500" />;
    case "video":
      return <Video className="size-16 text-purple-500" />;
    case "audio":
      return <Music className="size-16 text-orange-500" />;
    default:
      return <File className="size-16 text-slate-400" />;
  }
}

function PropertyRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "mt-1 break-all font-mono text-sm" : "mt-1 text-sm"}>
        {value}
      </p>
    </div>
  );
}

export function FilePropertiesPanel({
  file,
  onClose,
  onLoadPreview,
  onDownload,
  onDelete,
  onRename,
}: FilePropertiesPanelProps) {
  const [previewData, setPreviewData] = useState<Uint8Array | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isFileTooLarge = file?.sizeBytes !== undefined && file.sizeBytes > PREVIEW_SIZE_LIMIT;

  useEffect(() => {
    if (!file || file.type === "folder" || !onLoadPreview || !canPreviewFile(file.name) || isFileTooLarge) {
      setPreviewData(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    onLoadPreview(file.keyPath)
      .then((data) => {
        if (cancelled) return;
        setPreviewData(data);
        setPreviewLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setPreviewError(err instanceof Error ? err.message : "Failed to load preview");
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file?.keyPath, file?.type, file?.name, file?.sizeBytes, onLoadPreview, isFileTooLarge]);

  if (!file) return null;

  const typeInfo = getFileTypeInfo(file.name);

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (isFileTooLarge && file.sizeBytes !== undefined) {
      return (
        <FileTooLarge
          filename={file.name}
          fileSize={file.sizeBytes}
          maxSize={PREVIEW_SIZE_LIMIT}
        />
      );
    }

    if (previewError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          {getPreviewIcon(file)}
          <p className="text-sm">Failed to load preview</p>
        </div>
      );
    }

    if (previewData) {
      return (
        <FilePreviewDispatcher
          file={file}
          data={previewData}
          onError={(err) => setPreviewError(err.message)}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center">
        {getPreviewIcon(file)}
      </div>
    );
  };

  const getPreviewContainerClass = () => {
    if (file.type === "folder" || !canPreviewFile(file.name)) {
      return "aspect-square";
    }

    switch (typeInfo.previewType) {
      case "image":
        return "aspect-square";
      case "text":
        return "h-64";
      case "pdf":
        return "h-80";
      case "video":
        return "aspect-video";
      case "audio":
        return "h-40";
      default:
        return "aspect-square";
    }
  };

  const isFolder = file.type === "folder";

  return (
    <div className="flex h-full w-96 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={cn(
            "mb-6 overflow-hidden rounded-lg bg-muted",
            getPreviewContainerClass()
          )}
        >
          {renderPreview()}
        </div>

        <div className="space-y-4">
          <PropertyRow label="Name" value={file.name} />

          <div className="grid grid-cols-2 gap-4">
            <PropertyRow label="Size" value={file.size || "—"} />
            <PropertyRow
              label="Type"
              value={file.mimeType?.split("/")[1]?.toUpperCase() || "—"}
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Public Access
            </p>
            <Badge
              variant="outline"
              className={
                file.isPublic
                  ? "mt-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "mt-1 border-slate-200 bg-slate-100 text-slate-700"
              }
            >
              {file.isPublic ? "Public" : "Restricted"}
            </Badge>
          </div>

          <PropertyRow label="Key Path" value={file.keyPath} mono />

          {file.storageClass && (
            <PropertyRow label="Storage Class" value={file.storageClass} />
          )}

          {file.etag && <PropertyRow label="ETag" value={file.etag} mono />}
        </div>
      </div>

      <Separator />

      <div className="p-4">
        <div className="flex gap-2">
          {!isFolder && (
            <Button variant="outline" className="flex-1" onClick={onDownload}>
              <Download className="mr-2 size-4" />
              Download
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={onRename} title="Rename">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
