import { useState, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewLoading, PreviewError } from "./preview-placeholder";
import type { PdfPreviewProps } from "@/types/preview";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PdfPreview({ data, onError }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pdfData = useMemo(() => {
    return { data };
  }, [data]);

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(null);
  };

  const handleDocumentError = (error: Error) => {
    setLoadError(error.message);
    onError?.(error);
  };

  if (loadError) {
    return <PreviewError message={loadError} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted">
        <Document
          file={pdfData}
          onLoadSuccess={handleDocumentLoad}
          onLoadError={handleDocumentError}
          loading={<PreviewLoading />}
          className="flex justify-center"
        >
          <Page
            pageNumber={currentPage}
            width={340}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      {numPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
