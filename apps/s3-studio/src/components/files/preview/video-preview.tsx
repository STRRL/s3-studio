import { useMemo, useEffect } from "react";
import { getFileTypeInfo } from "@/lib/file-types";
import type { MediaPreviewProps } from "@/types/preview";

export default function VideoPreview({ data, filename }: MediaPreviewProps) {
  const videoUrl = useMemo(() => {
    const { mimeType } = getFileTypeInfo(filename);
    const blob = new Blob([data as BlobPart], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [data, filename]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  return (
    <div className="flex h-full items-center justify-center rounded bg-black">
      <video
        src={videoUrl}
        controls
        className="max-h-full max-w-full rounded"
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}
