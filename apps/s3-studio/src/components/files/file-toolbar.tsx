"use client";

import { Upload, FolderPlus, List, LayoutGrid, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileToolbarProps {
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  onUpload?: () => void;
  onNewFolder?: () => void;
  onRefresh?: () => void;
}

export function FileToolbar({
  viewMode,
  onViewModeChange,
  onUpload,
  onNewFolder,
  onRefresh,
}: FileToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button onClick={onUpload}>
          <Upload className="mr-2 size-4" />
          Upload
        </Button>
        <Button variant="outline" onClick={onNewFolder}>
          <FolderPlus className="mr-2 size-4" />
          New Folder
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
          <RefreshCw className="size-4" />
        </Button>
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
