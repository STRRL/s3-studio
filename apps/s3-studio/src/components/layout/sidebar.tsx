import { Database, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ProfileSelector } from "@/components/profiles/profile-selector";

interface SidebarProps {
  onAddProfile: () => void;
  onEditProfile: (profileId: string) => void;
  onDisconnect: () => void;
  activeProfileId: string | null;
}

export function Sidebar({ onAddProfile, onEditProfile, onDisconnect, activeProfileId }: SidebarProps) {
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
          <ProfileSelector
            onAddNew={onAddProfile}
            onEdit={onEditProfile}
            onDisconnect={onDisconnect}
          />
        </ScrollArea>

        <div className="border-t px-3 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => activeProfileId && onEditProfile(activeProfileId)}
            disabled={!activeProfileId}
            title={activeProfileId ? "Edit active profile settings" : "Select a profile first"}
          >
            <Settings className="size-4" />
            Settings
          </Button>
        </div>
      </div>
    </aside>
  );
}
