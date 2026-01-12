"use client";

import { useState } from "react";
import { Key, Server, Globe, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { S3Config } from "@/lib/types";

interface CredentialFormProps {
  initialConfig?: S3Config | null;
  onSubmit: (config: S3Config) => void;
  onCancel?: () => void;
}

export function CredentialForm({ initialConfig, onSubmit, onCancel }: CredentialFormProps) {
  const [accessKeyId, setAccessKeyId] = useState(initialConfig?.accessKeyId || "");
  const [secretAccessKey, setSecretAccessKey] = useState(initialConfig?.secretAccessKey || "");
  const [region, setRegion] = useState(initialConfig?.region || "us-east-1");
  const [bucket, setBucket] = useState(initialConfig?.bucket || "");
  const [endpoint, setEndpoint] = useState(initialConfig?.endpoint || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
      endpoint: endpoint || undefined,
    });
  };

  const isValid = accessKeyId && secretAccessKey && region && bucket;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Database className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">S3 Studio</CardTitle>
          <CardDescription>
            Enter your S3 credentials to connect. Your credentials are stored locally and never sent to any server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={!isValid}>
                Connect
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
