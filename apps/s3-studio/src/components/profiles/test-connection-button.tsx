import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTestConnection } from '@/hooks/use-test-connection';
import type { S3Config, ConnectionTestResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TestConnectionButtonProps {
  config: S3Config;
  onResult?: (result: ConnectionTestResult) => void;
  className?: string;
}

export function TestConnectionButton({
  config,
  onResult,
  className,
}: TestConnectionButtonProps) {
  const { testConnection, testing, result, reset } = useTestConnection();

  const isConfigValid =
    config.accessKeyId &&
    config.secretAccessKey &&
    config.region &&
    config.bucket;

  const handleTest = async () => {
    reset();
    const testResult = await testConnection(config);
    onResult?.(testResult);
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={testing || !isConfigValid}
      >
        {testing && <Loader2 className="size-4 animate-spin" />}
        {testing ? 'Testing...' : 'Test Connection'}
      </Button>

      {result && result.status === 'success' && (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="size-4" />
          <span className="text-sm">{result.message}</span>
        </div>
      )}

      {result && result.status === 'error' && (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="size-4" />
          <span className="text-sm">{result.message}</span>
        </div>
      )}
    </div>
  );
}
