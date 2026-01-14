import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/lib/types';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  message?: string;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  { color: string; label: string }
> = {
  idle: {
    color: 'bg-gray-400',
    label: 'Not tested',
  },
  testing: {
    color: 'bg-blue-500 animate-pulse',
    label: 'Testing...',
  },
  success: {
    color: 'bg-green-500',
    label: 'Connected',
  },
  error: {
    color: 'bg-red-500',
    label: 'Error',
  },
};

export function ConnectionStatus({
  status,
  message,
  showLabel = false,
  className,
}: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      title={message || config.label}
    >
      <span className={cn('size-2 rounded-full shrink-0', config.color)} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
