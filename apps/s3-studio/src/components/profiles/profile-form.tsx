"use client";

import { useState } from "react";
import { Key, Server, Globe, Database, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestConnectionButton } from "./test-connection-button";
import type { S3Config, S3Profile } from "@/lib/types";

interface ProfileFormProps {
  initialProfile?: S3Profile | null;
  onSubmit: (name: string, config: S3Config) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function ProfileForm({
  initialProfile,
  onSubmit,
  onCancel,
  onDelete,
  showDelete = false,
}: ProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name || "");
  const [accessKeyId, setAccessKeyId] = useState(
    initialProfile?.config.accessKeyId || ""
  );
  const [secretAccessKey, setSecretAccessKey] = useState(
    initialProfile?.config.secretAccessKey || ""
  );
  const [region, setRegion] = useState(
    initialProfile?.config.region || "us-east-1"
  );
  const [bucket, setBucket] = useState(initialProfile?.config.bucket || "");
  const [endpoint, setEndpoint] = useState(
    initialProfile?.config.endpoint || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, {
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
      endpoint: endpoint || undefined,
    });
  };

  const isValid = name && accessKeyId && secretAccessKey && region && bucket;

  const currentConfig: S3Config = {
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    endpoint: endpoint || undefined,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Profile Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="My S3 Connection"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-9"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Access Key ID</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="AKIAIOSFODNN7EXAMPLE"
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Secret Access Key</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Region</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="us-east-1"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bucket</label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="my-bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Custom Endpoint <span className="text-muted-foreground">(optional)</span>
        </label>
        <div className="relative">
          <Server className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://s3.example.com"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          For S3-compatible services like MinIO, Cloudflare R2, etc.
        </p>
      </div>

      <TestConnectionButton config={currentConfig} className="pt-2" />

      <div className="flex gap-2 pt-4">
        {showDelete && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
        <div className="flex-1" />
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!isValid}>
          {initialProfile ? "Save Changes" : "Create Profile"}
        </Button>
      </div>
    </form>
  );
}
