import { Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import { ProfileSelector } from "@/components/profiles/profile-selector";
import { navigationSections } from "@/lib/constants";

interface SidebarProps {
  onAddProfile: () => void;
  onEditProfile: (profileId: string) => void;
}

export function Sidebar({ onAddProfile, onEditProfile }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="size-4" />
          </div>
          <span className="font-semibold">S3 Studio</span>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            <ProfileSelector
              onAddNew={onAddProfile}
              onEdit={onEditProfile}
            />

            <div>
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Navigation
              </p>
              <SidebarNav sections={navigationSections.slice(0, 1)} />
            </div>

            <SidebarNav sections={navigationSections.slice(1)} />
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
