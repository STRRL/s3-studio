import { useState, useCallback } from 'react';
import type { S3Config, ConnectionTestResult } from '@/lib/types';
import { useWasm } from './use-wasm';

export function useTestConnection() {
  const { initialized } = useWasm();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const testConnection = useCallback(
    async (config: S3Config): Promise<ConnectionTestResult> => {
      if (!initialized) {
        const res: ConnectionTestResult = {
          status: 'error',
          message: 'WASM not initialized. Please wait and try again.',
        };
        setResult(res);
        return res;
      }

      setTesting(true);
      setResult({ status: 'testing' });

      try {
        const { S3Client } = await import('@s3-studio/opendal-wasm');

        const wasmClient = new S3Client(
          config.accessKeyId,
          config.secretAccessKey,
          config.region,
          config.bucket,
          config.endpoint || null
        );

        try {
          await wasmClient.list('/');

          const res: ConnectionTestResult = {
            status: 'success',
            message: 'Connection successful',
            testedAt: new Date().toISOString(),
          };
          setResult(res);
          return res;
        } finally {
          wasmClient.free();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        const res: ConnectionTestResult = {
          status: 'error',
          message,
          testedAt: new Date().toISOString(),
        };
        setResult(res);
        return res;
      } finally {
        setTesting(false);
      }
    },
    [initialized]
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { testConnection, testing, result, reset };
}
