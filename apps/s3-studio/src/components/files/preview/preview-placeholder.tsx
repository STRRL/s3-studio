import { Loader2, File, AlertCircle, Download } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

export function PreviewLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

interface PreviewErrorProps {
  message?: string;
}

export function PreviewError({ message = "Failed to load preview" }: PreviewErrorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <AlertCircle className="size-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface UnsupportedPreviewProps {
  filename: string;
}

export function UnsupportedPreview({ filename }: UnsupportedPreviewProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <File className="size-16" />
      <p className="text-sm">Preview not available</p>
      <p className="max-w-[200px] truncate text-xs">{filename}</p>
    </div>
  );
}

interface FileTooLargeProps {
  filename: string;
  fileSize: number;
  maxSize: number;
}

export function FileTooLarge({ filename, fileSize, maxSize }: FileTooLargeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Download className="size-12" />
      <div className="text-center">
        <p className="text-sm font-medium">File too large to preview</p>
        <p className="mt-1 text-xs">
          {formatFileSize(fileSize)} exceeds {formatFileSize(maxSize)} limit
        </p>
      </div>
      <p className="max-w-[200px] truncate text-xs">{filename}</p>
      <p className="text-xs">Please download the file to view it</p>
    </div>
  );
}
