'use client';

import { useState, useEffect } from 'react';
import { CredentialForm } from '@/components/credential-form';
import { FileList } from '@/components/file-list';
import { FileUpload } from '@/components/file-upload';
import { useS3Client } from '@/hooks/use-s3-client';
import { saveConfig, loadConfig, clearConfig } from '@/lib/storage';
import type { S3Config, FileEntry } from '@/lib/types';

export default function Home() {
  const [config, setConfig] = useState<S3Config | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { client, loading, error } = useS3Client(config);

  useEffect(() => {
    const stored = loadConfig();
    if (stored) {
      setConfig(stored);
    } else {
      setShowConfig(true);
    }
  }, []);

  function handleConfigSubmit(newConfig: S3Config) {
    saveConfig(newConfig);
    setConfig(newConfig);
    setShowConfig(false);
  }

  function handleDisconnect() {
    clearConfig();
    setConfig(null);
    setShowConfig(true);
  }

  async function handleDownload(file: FileEntry) {
    if (!client) return;

    try {
      const data = await client.read(file.path);
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function handleDelete(file: FileEntry) {
    if (!client) return;

    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      await client.delete(file.path);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function handleUploadComplete() {
    setRefreshKey((prev) => prev + 1);
  }

  if (showConfig || !config) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">S3 Studio</h1>
            <p className="text-gray-600">WebAssembly-powered S3 file browser</p>
          </div>
          <CredentialForm onSubmit={handleConfigSubmit} initialConfig={config} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">S3 Studio</h1>
              <p className="text-sm text-gray-600">
                Bucket: <span className="font-mono">{config.bucket}</span> | Region: {config.region}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading && !client && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to S3...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Connection failed</h3>
            <p className="text-red-600 text-sm mb-3">{error.message}</p>
            <button
              onClick={() => setShowConfig(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              Reconfigure
            </button>
          </div>
        )}

        {client && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
              <FileUpload
                client={client}
                currentPath="/"
                onUploadComplete={handleUploadComplete}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">File List</h2>
              <FileList
                key={refreshKey}
                client={client}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            🔒 Your credentials stay in the browser and are never sent to any server.
          </p>
          <p className="mt-2">
            Built with{' '}
            <a
              href="https://opendal.apache.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Apache OpenDAL
            </a>{' '}
            and WebAssembly
          </p>
        </div>
      </footer>
    </main>
  );
}
