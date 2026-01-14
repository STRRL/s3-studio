import { useMemo, useEffect } from "react";
import { Music } from "lucide-react";
import { getFileTypeInfo } from "@/lib/file-types";
import type { MediaPreviewProps } from "@/types/preview";

export default function AudioPreview({ data, filename }: MediaPreviewProps) {
  const audioUrl = useMemo(() => {
    const { mimeType } = getFileTypeInfo(filename);
    const blob = new Blob([data as BlobPart], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [data, filename]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded bg-muted p-4">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <Music className="size-10 text-primary" />
      </div>
      <p className="max-w-full truncate text-sm text-muted-foreground">
        {filename}
      </p>
      <audio src={audioUrl} controls className="w-full max-w-xs" preload="metadata">
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
