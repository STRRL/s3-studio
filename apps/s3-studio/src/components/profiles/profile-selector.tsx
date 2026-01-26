"use client";

import { Plus, MoreVertical, Settings, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectionStatus } from "./connection-status";
import { useProfileStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";

interface ProfileSelectorProps {
  onAddNew: () => void;
  onEdit: (profileId: string) => void;
  onDisconnect: () => void;
}

export function ProfileSelector({ onAddNew, onEdit, onDisconnect }: ProfileSelectorProps) {
  const {
    profiles,
    profileOrder,
    activeProfileId,
    connectionTest,
    setActiveProfile,
  } = useProfileStore();

  const hasProfiles = profileOrder.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Connections
        </p>
        <Button
          variant="outline"
          size="icon-sm"
          className="size-6"
          onClick={onAddNew}
          title="Add new profile"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {hasProfiles ? (
        <div className="space-y-1">
          {profileOrder.map((profileId) => {
            const profile = profiles[profileId];
            if (!profile) return null;

            const isActive = profileId === activeProfileId;
            const testResult = connectionTest[profileId];
            const status = testResult?.status || "idle";

            return (
              <div
                key={profileId}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onClick={() => setActiveProfile(profileId)}
              >
                <ConnectionStatus status={status} message={testResult?.message} />
                <span className="flex-1 truncate text-sm">{profile.name}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 shrink-0"
                        title="Profile options"
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom">
                      <DropdownMenuItem onClick={() => onEdit(profileId)}>
                        <Settings className="size-4" />
                        Settings
                      </DropdownMenuItem>
                      {isActive && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDisconnect()}
                        >
                          <Power className="size-4" />
                          Disconnect
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">No connections yet</p>
          <Button variant="outline" size="sm" onClick={onAddNew}>
            <Plus className="size-3.5" />
            Add Connection
          </Button>
        </div>
      )}
    </div>
  );
}
