"use client";

import { Home, ChevronRight } from "lucide-react";
import React from "react";

interface FileBreadcrumbProps {
  bucketId: string;
  path: string[];
}

export function FileBreadcrumb({ bucketId, path }: FileBreadcrumbProps) {
  const segments = [
    { label: bucketId, href: `/buckets/${bucketId}` },
    ...path.map((segment, index) => ({
      label: segment,
      href: `/buckets/${bucketId}/${path.slice(0, index + 1).join("/")}`,
    })),
  ];

  return (
    <nav className="flex items-center gap-1 text-sm">
      <a
        href={`#/buckets/${bucketId}`}
        className="flex items-center text-muted-foreground hover:text-foreground"
      >
        <Home className="size-4" />
      </a>
      {segments.map((segment, index) => (
        <React.Fragment key={segment.href}>
          <ChevronRight className="size-4 text-muted-foreground" />
          {index === segments.length - 1 ? (
            <span className="font-medium">{segment.label}</span>
          ) : (
            <a
              href={`#${segment.href}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {segment.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
