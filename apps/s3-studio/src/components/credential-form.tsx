import { useState } from 'react';
import type { S3Config } from '@/lib/types';

interface CredentialFormProps {
  onSubmit: (config: S3Config) => void;
  initialConfig?: S3Config | null;
}

export function CredentialForm({ onSubmit, initialConfig }: CredentialFormProps) {
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: initialConfig?.accessKeyId || '',
    secretAccessKey: initialConfig?.secretAccessKey || '',
    sessionToken: initialConfig?.sessionToken || '',
    region: initialConfig?.region || 'us-east-1',
    bucket: initialConfig?.bucket || '',
    endpoint: initialConfig?.endpoint || '',
  });

  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  const isValid = config.accessKeyId && config.secretAccessKey && config.region && config.bucket;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Configure S3 Connection</h2>
        <p className="text-sm text-muted-foreground">
          ⚠️ Credentials are stored locally in your browser and never sent to any server.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="accessKeyId" className="block text-sm font-medium mb-2">
            Access Key ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="accessKeyId"
            value={config.accessKeyId}
            onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="AKIAIOSFODNN7EXAMPLE"
            required
          />
        </div>

        <div>
          <label htmlFor="secretAccessKey" className="block text-sm font-medium mb-2">
            Secret Access Key <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              id="secretAccessKey"
              value={config.secretAccessKey}
              onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              required
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
            >
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="sessionToken" className="block text-sm font-medium mb-2">
            Session Token (optional)
          </label>
          <input
            type="text"
            id="sessionToken"
            value={config.sessionToken}
            onChange={(e) => setConfig({ ...config, sessionToken: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Session token for temporary credentials"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Required when using STS temporary credentials
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-2">
              Region <span className="text-red-500">*</span>
            </label>
            <select
              id="region"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-east-2">US East (Ohio)</option>
              <option value="us-west-1">US West (N. California)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="ap-east-1">Asia Pacific (Hong Kong)</option>
              <option value="ap-south-1">Asia Pacific (Mumbai)</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
              <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
              <option value="eu-central-1">Europe (Frankfurt)</option>
              <option value="eu-west-1">Europe (Ireland)</option>
              <option value="eu-west-2">Europe (London)</option>
              <option value="eu-west-3">Europe (Paris)</option>
            </select>
          </div>

          <div>
            <label htmlFor="bucket" className="block text-sm font-medium mb-2">
              Bucket Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bucket"
              value={config.bucket}
              onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-bucket"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="endpoint" className="block text-sm font-medium mb-2">
            Custom Endpoint (optional)
          </label>
          <input
            type="text"
            id="endpoint"
            value={config.endpoint}
            onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://s3.example.com"
          />
          <p className="text-xs text-muted-foreground mt-1">
            For S3-compatible services (MinIO, Wasabi, etc.)
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="font-semibold text-sm mb-2">🔒 Security Tips</h3>
        <ul className="text-xs space-y-1 text-gray-700">
          <li>- Credentials are stored only in browser localStorage.</li>
          <li>- They are never sent to any third-party server.</li>
          <li>- Prefer IAM users with the minimum required permissions.</li>
          <li>- Rotate your access keys regularly.</li>
          <li>- Configure your S3 bucket CORS policy to allow browser access.</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Connect to S3
      </button>
    </form>
  );
}
