"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FileItem } from "@/types/file";

interface RenameDialogProps {
  open: boolean;
  file: FileItem | null;
  onRename: (file: FileItem, newName: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function RenameDialog({
  open,
  file,
  onRename,
  onOpenChange,
}: RenameDialogProps) {
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && open) {
      setNewName(file.name);
      setError(null);
    }
  }, [file, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) return;

    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError("Name cannot be empty");
      return;
    }

    if (trimmedName.includes("/")) {
      setError("Name cannot contain slashes");
      return;
    }

    if (trimmedName === file.name) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onRename(file, trimmedName);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Rename {file.type === "folder" ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for "{file.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
