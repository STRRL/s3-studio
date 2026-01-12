"use client";

import { MoreHorizontal, Pencil, Trash2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bucket } from "@/types/bucket";

interface BucketActionsProps {
  bucket: Bucket;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BucketActions(_props: BucketActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <ExternalLink className="mr-2 size-4" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 size-4" />
          Copy ARN
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Pencil className="mr-2 size-4" />
          Edit settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 size-4" />
          Delete bucket
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
