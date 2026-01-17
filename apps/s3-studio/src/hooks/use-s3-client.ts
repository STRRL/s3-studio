import { useState, useEffect, useCallback, useRef } from 'react';
import type { S3Config, S3ClientWrapper, FileEntry } from '@/lib/types';
import { useWasm } from './use-wasm';

export function useS3Client(config: S3Config | null) {
  const { initialized, loading: wasmLoading, error: wasmError } = useWasm();
  const [client, setClient] = useState<S3ClientWrapper | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<S3ClientWrapper | null>(null);

  const createClient = useCallback(async (cfg: S3Config) => {
    if (!initialized) {
      throw new Error('WASM not initialized');
    }

    try {
      const { S3Client } = await import('@s3-studio/opendal-wasm');

      const wasmClient = new S3Client(
        cfg.accessKeyId,
        cfg.secretAccessKey,
        cfg.region,
        cfg.bucket,
        cfg.endpoint || null
      );

      const wrapper: S3ClientWrapper = {
        list: async (path: string) => {
          const result = await wasmClient.list(path);
          return result as FileEntry[];
        },
        read: (path: string) => wasmClient.read(path),
        write: (path: string, data: Uint8Array) => wasmClient.write(path, data),
        delete: (path: string) => wasmClient.delete(path),
        stat: async (path: string) => {
          const result = await wasmClient.stat(path);
          return result as FileEntry;
        },
        rename: (from: string, to: string) => wasmClient.rename(from, to),
        createDir: (path: string) => wasmClient.create_dir(path),
        free: () => wasmClient.free(),
      };

      return wrapper;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create S3 client');
    }
  }, [initialized]);

  useEffect(() => {
    if (!config || !initialized || wasmLoading) {
      return;
    }

    setLoading(true);
    setError(null);

    let isCancelled = false;

    createClient(config)
      .then((newClient) => {
        if (isCancelled) {
          newClient.free();
          return;
        }
        clientRef.current = newClient;
        setClient(newClient);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to create client'));
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      if (clientRef.current) {
        clientRef.current.free();
        clientRef.current = null;
      }
    };
  }, [config, initialized, wasmLoading, createClient]);

  return {
    client,
    loading: wasmLoading || loading,
    error: wasmError || error,
  };
}
