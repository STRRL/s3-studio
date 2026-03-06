export interface StorageProviderConfig {
  id: "r2" | "supabase";
  label: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint: string;
}

interface ProviderDescriptor {
  id: StorageProviderConfig["id"];
  label: string;
  envPrefix: string;
}

const PROVIDERS: ProviderDescriptor[] = [
  { id: "r2", label: "Cloudflare R2", envPrefix: "E2E_R2" },
  { id: "supabase", label: "Supabase Storage", envPrefix: "E2E_SUPABASE" },
];

const REQUIRED_KEYS = [
  "ACCESS_KEY_ID",
  "SECRET_ACCESS_KEY",
  "REGION",
  "BUCKET",
  "ENDPOINT",
] as const;

function readEnv(key: string): string {
  return (process.env[key] || "").trim();
}

function loadProvider(descriptor: ProviderDescriptor): StorageProviderConfig | null {
  const env = {
    accessKeyId: readEnv(`${descriptor.envPrefix}_ACCESS_KEY_ID`),
    secretAccessKey: readEnv(`${descriptor.envPrefix}_SECRET_ACCESS_KEY`),
    region: readEnv(`${descriptor.envPrefix}_REGION`),
    bucket: readEnv(`${descriptor.envPrefix}_BUCKET`),
    endpoint: readEnv(`${descriptor.envPrefix}_ENDPOINT`),
  };

  const presentValues = Object.values(env).filter((value) => value.length > 0).length;
  if (presentValues === 0) {
    return null;
  }

  const missing: string[] = [];
  for (const key of REQUIRED_KEYS) {
    if (!readEnv(`${descriptor.envPrefix}_${key}`)) {
      missing.push(`${descriptor.envPrefix}_${key}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Incomplete ${descriptor.label} E2E config. Missing env vars: ${missing.join(", ")}`
    );
  }

  return {
    ...env,
    id: descriptor.id,
    label: descriptor.label,
  };
}

export function getConfiguredProviders(): StorageProviderConfig[] {
  return PROVIDERS.map((descriptor) => loadProvider(descriptor)).filter(
    (provider): provider is StorageProviderConfig => provider !== null
  );
}
