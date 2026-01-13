import { useState, useEffect, useMemo } from "react";
import { codeToHtml } from "shiki";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import type { TextPreviewProps } from "@/types/preview";

const MAX_PREVIEW_SIZE = 1024 * 1024;

export default function TextPreview({
  data,
  language = "text",
  maxSize = MAX_PREVIEW_SIZE,
  onError,
}: TextPreviewProps) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);

  const textContent = useMemo(() => {
    const decoder = new TextDecoder("utf-8");
    if (data.length > maxSize) {
      setTruncated(true);
      return decoder.decode(data.slice(0, maxSize));
    }
    setTruncated(false);
    return decoder.decode(data);
  }, [data, maxSize]);

  useEffect(() => {
    let cancelled = false;

    codeToHtml(textContent, {
      lang: language,
      theme: "github-dark",
    })
      .then((result) => {
        if (!cancelled) {
          setHtml(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          onError?.(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [textContent, language, onError]);

  if (loading) {
    return <div className="h-full animate-pulse rounded bg-muted" />;
  }

  return (
    <div className="flex h-full flex-col">
      {truncated && (
        <div className="flex items-center gap-2 rounded-t bg-yellow-50 p-2 text-xs text-yellow-700">
          <AlertCircle className="size-3" />
          <span>File truncated to 1MB for preview</span>
        </div>
      )}
      <ScrollArea className="flex-1 rounded bg-[#0d1117]">
        <div
          className="p-4 font-mono text-sm [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </ScrollArea>
    </div>
  );
}
