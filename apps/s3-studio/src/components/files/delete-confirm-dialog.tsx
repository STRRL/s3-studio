"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FileItem } from "@/types/file";

interface DeleteConfirmDialogProps {
  open: boolean;
  file: FileItem | null;
  onDelete: (file: FileItem) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({
  open,
  file,
  onDelete,
  onOpenChange,
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      await onDelete(file);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  const itemType = file.type === "folder" ? "folder" : "file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle>Delete {itemType}?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete "{file.name}"?
            {file.type === "folder" && (
              <span className="block mt-2 font-medium text-destructive">
                This will delete all files and folders inside it.
              </span>
            )}
            <span className="block mt-2">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
