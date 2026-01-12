"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  Trash2,
  FileText,
  FileImage,
  File,
  Folder,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FileItem } from "@/types/file";

interface FilePropertiesPanelProps {
  file: FileItem | null;
  onClose: () => void;
  onLoadPreview?: (path: string) => Promise<Uint8Array>;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"];

function isImageFile(file: FileItem): boolean {
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  return IMAGE_EXTENSIONS.includes(ext);
}

function getPreviewIcon(file: FileItem) {
  if (file.type === "folder") {
    return <Folder className="size-16 text-blue-500" />;
  }
  const mimeType = file.mimeType || "";
  if (mimeType.startsWith("image/") || isImageFile(file)) {
    return <FileImage className="size-16 text-emerald-500" />;
  }
  if (mimeType.includes("pdf")) {
    return (
      <div className="flex size-16 items-center justify-center rounded bg-red-100">
        <span className="text-sm font-bold text-red-600">PDF</span>
      </div>
    );
  }
  if (mimeType.includes("text") || mimeType.includes("markdown")) {
    return <FileText className="size-16 text-blue-500" />;
  }
  return <File className="size-16 text-slate-400" />;
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

export function FilePropertiesPanel({ file, onClose, onLoadPreview }: FilePropertiesPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || file.type === "folder" || !onLoadPreview || !isImageFile(file)) {
      setPreviewUrl(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    onLoadPreview(file.keyPath)
      .then((data) => {
        if (cancelled) return;
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
        let mimeType = "image/png";
        if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
        else if (ext === ".gif") mimeType = "image/gif";
        else if (ext === ".webp") mimeType = "image/webp";
        else if (ext === ".svg") mimeType = "image/svg+xml";
        else if (ext === ".bmp") mimeType = "image/bmp";
        else if (ext === ".ico") mimeType = "image/x-icon";

        const arrayBuffer = new Uint8Array(data).buffer;
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setPreviewError(err instanceof Error ? err.message : "Failed to load preview");
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file?.keyPath, file?.type, file?.name, onLoadPreview]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!file) return null;

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (previewUrl && !previewError) {
      return (
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-full max-w-full object-contain rounded"
        />
      );
    }

    return getPreviewIcon(file);
  };

  return (
    <div className="flex h-full w-96 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 flex aspect-square items-center justify-center rounded-lg bg-muted">
          {renderPreview()}
        </div>

        <div className="space-y-4">
          <PropertyRow label="Name" value={file.name} />

          <div className="grid grid-cols-2 gap-4">
            <PropertyRow label="Size" value={file.size || "—"} />
            <PropertyRow label="Type" value={file.mimeType?.split("/")[1]?.toUpperCase() || "—"} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Public Access
            </p>
            <Badge
              variant="outline"
              className={
                file.isPublic
                  ? "mt-1 bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "mt-1 bg-slate-100 text-slate-700 border-slate-200"
              }
            >
              {file.isPublic ? "Public" : "Restricted"}
            </Badge>
          </div>

          <PropertyRow label="Key Path" value={file.keyPath} mono />

          {file.storageClass && (
            <PropertyRow label="Storage Class" value={file.storageClass} />
          )}

          {file.etag && (
            <PropertyRow label="ETag" value={file.etag} mono />
          )}
        </div>

      </div>

      <Separator />

      <div className="p-4">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 size-4" />
            Download
          </Button>
          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
        <Button
          variant="destructive"
          className="mt-2 w-full"
        >
          Delete File
        </Button>
      </div>
    </div>
  );
}
