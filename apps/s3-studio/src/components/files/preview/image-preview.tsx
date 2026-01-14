import { useMemo, useEffect } from "react";
import { getFileTypeInfo } from "@/lib/file-types";
import type { PreviewProps } from "@/types/preview";

export default function ImagePreview({ data, filename }: PreviewProps) {
  const imageUrl = useMemo(() => {
    const { mimeType } = getFileTypeInfo(filename);
    const blob = new Blob([data as BlobPart], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [data, filename]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  return (
    <div className="flex h-full items-center justify-center">
      <img
        src={imageUrl}
        alt={filename}
        className="max-h-full max-w-full rounded object-contain"
      />
    </div>
  );
}
