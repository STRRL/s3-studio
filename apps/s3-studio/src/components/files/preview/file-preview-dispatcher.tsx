import { Suspense, lazy } from "react";
import { getFileTypeInfo } from "@/lib/file-types";
import { PreviewLoading, UnsupportedPreview, FileTooLarge } from "./preview-placeholder";
import { PREVIEW_SIZE_LIMIT } from "@/lib/utils";
import type { FileItem } from "@/types/file";

const ImagePreview = lazy(() => import("./image-preview"));
const TextPreview = lazy(() => import("./text-preview"));
const PdfPreview = lazy(() => import("./pdf-preview"));
const VideoPreview = lazy(() => import("./video-preview"));
const AudioPreview = lazy(() => import("./audio-preview"));

interface FilePreviewDispatcherProps {
  file: FileItem;
  data: Uint8Array;
  onError?: (error: Error) => void;
}

export function FilePreviewDispatcher({
  file,
  data,
  onError,
}: FilePreviewDispatcherProps) {
  const typeInfo = getFileTypeInfo(file.name);
  const fileSize = file.sizeBytes ?? data.byteLength;

  if (fileSize > PREVIEW_SIZE_LIMIT) {
    return (
      <FileTooLarge
        filename={file.name}
        fileSize={fileSize}
        maxSize={PREVIEW_SIZE_LIMIT}
      />
    );
  }

  const previewProps = {
    data,
    filename: file.name,
    onError,
  };

  return (
    <Suspense fallback={<PreviewLoading />}>
      {typeInfo.previewType === "image" && <ImagePreview {...previewProps} />}
      {typeInfo.previewType === "text" && (
        <TextPreview {...previewProps} language={typeInfo.language} />
      )}
      {typeInfo.previewType === "pdf" && <PdfPreview {...previewProps} />}
      {typeInfo.previewType === "video" && <VideoPreview {...previewProps} />}
      {typeInfo.previewType === "audio" && <AudioPreview {...previewProps} />}
      {typeInfo.previewType === "unsupported" && (
        <UnsupportedPreview filename={file.name} />
      )}
    </Suspense>
  );
}
