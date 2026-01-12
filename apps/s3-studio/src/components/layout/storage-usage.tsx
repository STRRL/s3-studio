import { Progress } from "@/components/ui/progress";

interface StorageUsageProps {
  used: number;
  total: number;
  unit: string;
  percentage: number;
}

export function StorageUsage({ used, total, unit, percentage }: StorageUsageProps) {
  return (
    <div className="border-t px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Storage ({percentage}%)</span>
        <span className="font-medium">{used}/{total}{unit}</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}
