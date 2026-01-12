"use client";

import { useState } from "react";
import {
  X,
  Download,
  Trash2,
  FileText,
  FileImage,
  File,
  Copy,
  Pencil,
  Lock,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { FileItem } from "@/types/file";

interface FilePropertiesPanelProps {
  file: FileItem | null;
  onClose: () => void;
}

function getPreviewIcon(file: FileItem) {
  if (file.type === "folder") {
    return <Folder className="size-16 text-blue-500" />;
  }
  const mimeType = file.mimeType || "";
  if (mimeType.startsWith("image/")) {
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

export function FilePropertiesPanel({ file, onClose }: FilePropertiesPanelProps) {
  const [isPrivate, setIsPrivate] = useState(!file?.isPublic);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linkForFolder, setLinkForFolder] = useState(false);

  if (!file) return null;

  const handleGenerateLink = () => {
    setShareLink(`https://s3.example.com/share/${file.id}`);
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 flex aspect-square items-center justify-center rounded-lg bg-muted">
          {getPreviewIcon(file)}
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

        <Separator className="my-4" />

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Access & Sharing
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              <span className="text-sm">Private Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Pencil className="mr-1 size-3" />
                Edit
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-muted-foreground">Expiration</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="M" className="h-8 text-sm" />
              <Input placeholder="M/Y" className="h-8 text-sm" />
            </div>
          </div>

          <Button className="w-full" onClick={handleGenerateLink}>
            Generate Link
          </Button>

          {shareLink && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Active Share Link</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareLink}
                  className="h-8 flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={handleCopyLink}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="linkForFolder"
              checked={linkForFolder}
              onChange={(e) => setLinkForFolder(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <label htmlFor="linkForFolder" className="text-sm">
              Link for folder
            </label>
          </div>
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
