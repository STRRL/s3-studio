"use client";
import { Database, Shield, Globe, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BucketActions } from "./bucket-actions";
import type { Bucket, AccessType } from "@/types/bucket";
import { cn } from "@/lib/utils";

interface BucketTableProps {
  buckets: Bucket[];
}

function AccessBadge({ access }: { access: AccessType }) {
  const variants: Record<AccessType, { className: string; icon: React.ReactNode }> = {
    PUBLIC: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
      icon: <Globe className="mr-1 size-3" />,
    },
    PRIVATE: {
      className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
      icon: <Shield className="mr-1 size-3" />,
    },
    LIFECYCLE: {
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
      icon: <RefreshCw className="mr-1 size-3" />,
    },
  };

  const variant = variants[access];

  return (
    <Badge variant="outline" className={cn("font-medium", variant.className)}>
      {access}
    </Badge>
  );
}

function BucketIcon({ access }: { access: AccessType }) {
  const colors: Record<AccessType, string> = {
    PUBLIC: "text-emerald-600",
    PRIVATE: "text-slate-600",
    LIFECYCLE: "text-blue-600",
  };

  return <Database className={cn("size-4", colors[access])} />;
}

export function BucketTable({ buckets }: BucketTableProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buckets.map((bucket) => (
            <TableRow key={bucket.id}>
              <TableCell>
                <a
                  href={`#/buckets/${bucket.name}`}
                  className="flex items-center gap-3 font-medium hover:underline"
                >
                  <BucketIcon access={bucket.access} />
                  {bucket.name}
                </a>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {bucket.region}
              </TableCell>
              <TableCell>
                <AccessBadge access={bucket.access} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {bucket.size}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(bucket.createdAt)}
              </TableCell>
              <TableCell>
                <BucketActions bucket={bucket} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
