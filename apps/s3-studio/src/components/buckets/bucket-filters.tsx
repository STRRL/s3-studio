"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BucketFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function BucketFilters({ searchValue, onSearchChange }: BucketFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Filter buckets..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button variant="outline" size="sm">
        <SlidersHorizontal className="mr-2 size-4" />
        Filter
      </Button>
    </div>
  );
}
