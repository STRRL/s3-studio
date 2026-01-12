"use client";

import { Home, ChevronRight } from "lucide-react";
import React from "react";

interface FileBreadcrumbProps {
  bucketId: string;
  path: string[];
  onNavigateTo?: (pathIndex: number) => void;
}

export function FileBreadcrumb({ bucketId, path, onNavigateTo }: FileBreadcrumbProps) {
  const handleClick = (e: React.MouseEvent, pathIndex: number) => {
    e.preventDefault();
    onNavigateTo?.(pathIndex);
  };

  return (
    <nav className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={(e) => handleClick(e, -1)}
        className="flex items-center text-muted-foreground hover:text-foreground"
      >
        <Home className="size-4" />
      </button>
      <ChevronRight className="size-4 text-muted-foreground" />
      <button
        type="button"
        onClick={(e) => handleClick(e, -1)}
        className={path.length === 0 ? "font-medium" : "text-muted-foreground hover:text-foreground"}
      >
        {bucketId}
      </button>
      {path.map((segment, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="size-4 text-muted-foreground" />
          {index === path.length - 1 ? (
            <span className="font-medium">{segment}</span>
          ) : (
            <button
              type="button"
              onClick={(e) => handleClick(e, index)}
              className="text-muted-foreground hover:text-foreground"
            >
              {segment}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
