"use client";

import { Upload, FolderPlus, List, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileToolbarProps {
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export function FileToolbar({ viewMode, onViewModeChange }: FileToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button>
          <Upload className="mr-2 size-4" />
          Upload
        </Button>
        <Button variant="outline">
          <FolderPlus className="mr-2 size-4" />
          New Folder
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-r-none",
              viewMode === "list" && "bg-accent"
            )}
            onClick={() => onViewModeChange("list")}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-l-none border-l",
              viewMode === "grid" && "bg-accent"
            )}
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
        <Button variant="ghost" size="icon">
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
