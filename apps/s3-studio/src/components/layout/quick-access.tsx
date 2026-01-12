"use client";

import { cn } from "@/lib/utils";
import type { QuickAccessItem } from "@/types/navigation";

interface QuickAccessProps {
  items: QuickAccessItem[];
}

export function QuickAccess({ items }: QuickAccessProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Quick Access
      </p>
      {items.map((item) => {
        return (
          <a
            key={item.href}
            href={`#${item.href}`}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
