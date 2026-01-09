import { useState, useEffect } from 'react';

let wasmInitialized = false;
let wasmInitPromise: Promise<void> | null = null;

export function useWasm() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initWasm() {
      if (wasmInitialized) {
        setLoading(false);
        return;
      }

      if (wasmInitPromise) {
        try {
          await wasmInitPromise;
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('WASM initialization failed'));
        }
        return;
      }

      wasmInitPromise = (async () => {
        try {
          const wasmModule = await import('@s3-studio/opendal-wasm');
          await wasmModule.default();
          wasmInitialized = true;
          setLoading(false);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to load WASM');
          setError(error);
          throw error;
        }
      })();

      await wasmInitPromise;
    }

    initWasm();
  }, []);

  return { loading, error, initialized: wasmInitialized };
}
