"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateBucketDialog() {
  const [open, setOpen] = useState(false);
  const [bucketName, setBucketName] = useState("");

  const handleCreate = () => {
    setOpen(false);
    setBucketName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Create Bucket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new bucket</DialogTitle>
          <DialogDescription>
            Enter a unique name for your new S3 bucket.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="my-bucket-name"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Bucket names must be globally unique and follow S3 naming rules.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!bucketName}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
