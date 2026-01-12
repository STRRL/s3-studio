"use client";

import { Database, Star, Clock, Settings, KeyRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection, IconName } from "@/types/navigation";

const iconMap: Record<IconName, LucideIcon> = {
  database: Database,
  star: Star,
  clock: Clock,
  settings: Settings,
  "key-round": KeyRound,
};

interface SidebarNavProps {
  sections: NavSection[];
}

export function SidebarNav({ sections }: SidebarNavProps) {
  return (
    <nav className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-1">
          {section.title && (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <a
                key={item.href}
                href={`#${item.href}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
