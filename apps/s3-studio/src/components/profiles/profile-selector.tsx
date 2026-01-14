"use client";

import { Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "./connection-status";
import { useProfileStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";

interface ProfileSelectorProps {
  onAddNew: () => void;
  onEdit: (profileId: string) => void;
}

export function ProfileSelector({ onAddNew, onEdit }: ProfileSelectorProps) {
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
          variant="ghost"
          size="icon-sm"
          className="size-6"
          onClick={onAddNew}
          title="Add new profile"
        >
          <Plus className="size-3.5" />
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
                  "group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onClick={() => setActiveProfile(profileId)}
              >
                <ConnectionStatus status={status} message={testResult?.message} />
                <span className="flex-1 truncate text-sm">{profile.name}</span>
                {isActive && (
                  <Check className="size-3.5 text-primary shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(profileId);
                  }}
                  title="Edit profile"
                >
                  <Pencil className="size-3" />
                </Button>
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
