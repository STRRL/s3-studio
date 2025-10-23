'use client';

import { useState, useRef } from 'react';
import type { S3ClientWrapper } from '@/lib/types';

interface FileUploadProps {
  client: S3ClientWrapper;
  currentPath: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ client, currentPath, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const filePath = currentPath === '/' ? fileName : `${currentPath}/${fileName}`;

        setProgress((prev) => ({ ...prev, [fileName]: 0 }));

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await client.write(filePath, uint8Array);

        setProgress((prev) => ({ ...prev, [fileName]: 100 }));
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setProgress({});
        onUploadComplete?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const filePath = currentPath === '/' ? fileName : `${currentPath}/${fileName}`;

        setProgress((prev) => ({ ...prev, [fileName]: 0 }));

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await client.write(filePath, uint8Array);

        setProgress((prev) => ({ ...prev, [fileName]: 100 }));
      }

      setTimeout(() => {
        setProgress({});
        onUploadComplete?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const hasActiveUploads = Object.keys(progress).length > 0;

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={uploading}
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <span className="text-4xl">📤</span>
          <span className="text-sm font-medium">
            Click to choose files or drag them here
          </span>
          <span className="text-xs text-gray-500">
            Supports multiple files
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {hasActiveUploads && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Upload Progress</h3>
          {Object.entries(progress).map(([fileName, percent]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{fileName}</span>
                <span className="text-gray-600">{percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
