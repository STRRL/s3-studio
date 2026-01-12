import { Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";
import { QuickAccess } from "./quick-access";
import { StorageUsage } from "./storage-usage";
import {
  navigationSections,
  quickAccessItems,
  currentUser,
  storageUsage,
} from "@/lib/constants";

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="size-4" />
          </div>
          <span className="font-semibold">Storage Console</span>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            <div>
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Navigation
              </p>
              <SidebarNav sections={navigationSections.slice(0, 1)} />
            </div>

            <QuickAccess items={quickAccessItems} />

            <SidebarNav sections={navigationSections.slice(1)} />
          </div>
        </ScrollArea>

        <StorageUsage
          used={storageUsage.used}
          total={storageUsage.total}
          unit={storageUsage.unit}
          percentage={storageUsage.percentage}
        />

        <SidebarUser user={currentUser} />
      </div>
    </aside>
  );
}
