export interface PreviewProps {
  data: Uint8Array;
  filename: string;
  onError?: (error: Error) => void;
}

export interface TextPreviewProps extends PreviewProps {
  language?: string;
  maxSize?: number;
}

export interface PdfPreviewProps extends PreviewProps {
  initialPage?: number;
}

export interface MediaPreviewProps extends PreviewProps {
  autoPlay?: boolean;
}
