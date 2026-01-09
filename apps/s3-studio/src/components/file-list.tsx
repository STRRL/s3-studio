import { useState, useEffect } from 'react';
import type { FileEntry, S3ClientWrapper } from '@/lib/types';

interface FileListProps {
  client: S3ClientWrapper;
  onDownload?: (file: FileEntry) => void;
  onDelete?: (file: FileEntry) => void;
}

export function FileList({ client, onDownload, onDelete }: FileListProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, client]);

  function ensureDisplayName(entry: FileEntry): FileEntry {
    if (entry.name && entry.name.trim().length > 0) {
      return entry;
    }

    const rawPath = entry.path ?? '';
    const cleanedPath = rawPath.trim();
    const pathWithoutTrailingSlash =
      cleanedPath.endsWith('/') && cleanedPath.length > 1
        ? cleanedPath.slice(0, -1)
        : cleanedPath;
    const parts = pathWithoutTrailingSlash.split('/').filter(Boolean);
    const fallbackBase = parts.length > 0 ? parts[parts.length - 1] : '';
    const displayName =
      fallbackBase || (entry.is_dir ? '/' : cleanedPath || 'Untitled');

    // Ensure every row has a readable value in the "Name" column even if the WASM result omits it.
    return {
      ...entry,
      name: displayName,
    };
  }

  async function loadFiles(path: string) {
    setLoading(true);
    setError(null);
    try {
      const entries = await client.list(path);
      setFiles(entries.map(ensureDisplayName));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-US');
    } catch {
      return dateStr;
    }
  }

  function handleItemClick(file: FileEntry) {
    if (file.is_dir) {
      setCurrentPath(file.path);
    }
  }

  function handleBack() {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath('/' + parts.join('/'));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-semibold mb-2">Failed to load</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => loadFiles(currentPath)}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentPath !== '/' && (
            <button
              onClick={handleBack}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              ← Back
            </button>
          )}
          <span className="text-sm text-gray-600">
            Current path: <span className="font-mono">{currentPath || '/'}</span>
          </span>
        </div>
        <button
          onClick={() => loadFiles(currentPath)}
          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>This directory is empty</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Modified</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {files.map((file, index) => (
                <tr
                  key={file.path + index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleItemClick(file)}
                      className="flex items-center gap-2 text-left hover:text-blue-600"
                    >
                      <span className="text-xl">
                        {file.is_dir ? '📁' : '📄'}
                      </span>
                      <span className="font-medium">{file.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {file.is_dir ? '-' : formatSize(file.size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(file.last_modified)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!file.is_dir && onDownload && (
                        <button
                          onClick={() => onDownload(file)}
                          className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded"
                        >
                          Download
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(file)}
                          className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
