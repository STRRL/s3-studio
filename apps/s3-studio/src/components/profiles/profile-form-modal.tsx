"use client";

import { X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import type { S3Config, S3Profile } from "@/lib/types";

interface ProfileFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile?: S3Profile | null;
  onSubmit: (name: string, config: S3Config) => void;
  onDelete?: () => void;
}

export function ProfileFormModal({
  open,
  onOpenChange,
  editingProfile,
  onSubmit,
  onDelete,
}: ProfileFormModalProps) {
  if (!open) return null;

  const handleClose = () => onOpenChange(false);

  const handleSubmit = (name: string, config: S3Config) => {
    onSubmit(name, config);
    handleClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <Card className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="size-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Database className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>
                {editingProfile ? "Edit Profile" : "New Profile"}
              </CardTitle>
              <CardDescription>
                {editingProfile
                  ? "Update your S3 connection settings"
                  : "Add a new S3 connection profile"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialProfile={editingProfile}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            onDelete={editingProfile ? handleDelete : undefined}
            showDelete={!!editingProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
