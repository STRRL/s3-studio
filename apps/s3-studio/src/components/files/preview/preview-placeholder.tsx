import { Loader2, File, AlertCircle } from "lucide-react";

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
