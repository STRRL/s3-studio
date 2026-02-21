import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  S3Config,
  S3Profile,
  ConnectionTestResult,
  ProfileExportPayload,
  ProfileImportConflictStrategy,
  ProfileImportResult,
} from '@/lib/types';
import { generateProfileId, LEGACY_STORAGE_KEY } from '@/lib/storage';

const PROFILES_STORAGE_KEY = 's3-studio-profiles';
const PROFILE_EXPORT_VERSION = 1;

interface ProfileState {
  profiles: Record<string, S3Profile>;
  profileOrder: string[];
  activeProfileId: string | null;
  connectionTest: Record<string, ConnectionTestResult>;

  addProfile: (name: string, config: S3Config) => S3Profile;
  updateProfile: (id: string, updates: Partial<S3Config & { name: string }>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;

  setConnectionTestStatus: (profileId: string, result: ConnectionTestResult) => void;
  clearConnectionTest: (profileId: string) => void;

  exportProfiles: (options?: { includeSecrets?: boolean }) => ProfileExportPayload;
  importProfiles: (
    payload: unknown,
    options?: { strategy?: ProfileImportConflictStrategy }
  ) => ProfileImportResult;

  getActiveProfile: () => S3Profile | null;
  getActiveConfig: () => S3Config | null;
}

function migrateFromLegacyConfig(): Partial<ProfileState> | null {
  if (typeof window === 'undefined') return null;

  try {
    const legacyConfig = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyConfig) return null;

    const config = JSON.parse(legacyConfig) as S3Config;
    const id = generateProfileId();
    const now = new Date().toISOString();

    const profile: S3Profile = {
      id,
      name: 'Default Connection',
      config,
      createdAt: now,
      updatedAt: now,
    };

    localStorage.removeItem(LEGACY_STORAGE_KEY);

    return {
      profiles: { [id]: profile },
      profileOrder: [id],
      activeProfileId: id,
      connectionTest: {},
    };
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeConfig(input: unknown): S3Config {
  if (!isObject(input)) {
    throw new Error('Invalid profile config');
  }

  const accessKeyId = typeof input.accessKeyId === 'string' ? input.accessKeyId.trim() : '';
  const secretAccessKey =
    typeof input.secretAccessKey === 'string' ? input.secretAccessKey.trim() : '';
  const region = typeof input.region === 'string' ? input.region.trim() : '';
  const bucket = typeof input.bucket === 'string' ? input.bucket.trim() : '';
  const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : undefined;
  const sessionToken =
    typeof input.sessionToken === 'string' && input.sessionToken.trim().length > 0
      ? input.sessionToken.trim()
      : undefined;

  if (!accessKeyId || !region || !bucket) {
    throw new Error('Profile must include accessKeyId, region, and bucket');
  }

  return {
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    endpoint: endpoint || undefined,
    sessionToken,
  };
}

function getUniqueProfileName(existingNames: Set<string>, baseName: string): string {
  const trimmed = baseName.trim() || 'Imported Profile';
  const lower = trimmed.toLowerCase();
  if (!existingNames.has(lower)) {
    existingNames.add(lower);
    return trimmed;
  }

  let index = 1;
  while (true) {
    const candidate = `${trimmed} (Imported ${index})`;
    const candidateLower = candidate.toLowerCase();
    if (!existingNames.has(candidateLower)) {
      existingNames.add(candidateLower);
      return candidate;
    }
    index += 1;
  }
}

function parseImportPayload(payload: unknown): Array<{ name: string; config: S3Config }> {
  const source = payload as Record<string, unknown>;
  const list = Array.isArray(source?.profiles)
    ? source.profiles
    : Array.isArray(payload)
      ? payload
      : null;

  if (!list) {
    throw new Error('Invalid import file: missing profiles array');
  }

  const parsed: Array<{ name: string; config: S3Config }> = [];

  for (const item of list) {
    if (!isObject(item)) {
      throw new Error('Invalid profile item in import file');
    }

    const rawName = typeof item.name === 'string' ? item.name.trim() : '';
    const name = rawName || 'Imported Profile';
    const config = normalizeConfig(item.config);
    parsed.push({ name, config });
  }

  if (parsed.length === 0) {
    throw new Error('Import file has no profiles');
  }

  return parsed;
}

function buildExportConfig(config: S3Config, includeSecrets: boolean): S3Config {
  return {
    accessKeyId: config.accessKeyId,
    secretAccessKey: includeSecrets ? config.secretAccessKey : '',
    sessionToken: includeSecrets ? config.sessionToken : undefined,
    region: config.region,
    bucket: config.bucket,
    endpoint: config.endpoint,
  };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: {},
      profileOrder: [],
      activeProfileId: null,
      connectionTest: {},

      addProfile: (name, config) => {
        const id = generateProfileId();
        const now = new Date().toISOString();
        const profile: S3Profile = {
          id,
          name,
          config,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          profiles: { ...state.profiles, [id]: profile },
          profileOrder: [...state.profileOrder, id],
        }));

        return profile;
      },

      updateProfile: (id, updates) => {
        set((state) => {
          const existing = state.profiles[id];
          if (!existing) return state;

          const { name, ...configUpdates } = updates;
          const hasConfigUpdates = Object.keys(configUpdates).length > 0;

          return {
            profiles: {
              ...state.profiles,
              [id]: {
                ...existing,
                name: name ?? existing.name,
                config: hasConfigUpdates
                  ? { ...existing.config, ...configUpdates }
                  : existing.config,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      deleteProfile: (id) => {
        set((state) => {
          const remainingProfiles = { ...state.profiles };
          delete remainingProfiles[id];

          const newOrder = state.profileOrder.filter((pid) => pid !== id);
          const newActiveId =
            state.activeProfileId === id ? (newOrder[0] ?? null) : state.activeProfileId;

          const remainingTests = { ...state.connectionTest };
          delete remainingTests[id];

          return {
            profiles: remainingProfiles,
            profileOrder: newOrder,
            activeProfileId: newActiveId,
            connectionTest: remainingTests,
          };
        });
      },

      setActiveProfile: (id) => {
        set({ activeProfileId: id });
      },

      setConnectionTestStatus: (profileId, result) => {
        set((state) => ({
          connectionTest: { ...state.connectionTest, [profileId]: result },
        }));
      },

      clearConnectionTest: (profileId) => {
        set((state) => {
          const nextConnectionTest = { ...state.connectionTest };
          delete nextConnectionTest[profileId];
          return { connectionTest: nextConnectionTest };
        });
      },

      exportProfiles: ({ includeSecrets = false } = {}) => {
        const state = get();
        const profiles = state.profileOrder
          .map((profileId) => state.profiles[profileId])
          .filter((profile): profile is S3Profile => Boolean(profile))
          .map((profile) => ({
            name: profile.name,
            config: buildExportConfig(profile.config, includeSecrets),
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }));

        return {
          version: PROFILE_EXPORT_VERSION,
          exportedAt: new Date().toISOString(),
          includeSecrets,
          profiles,
        };
      },

      importProfiles: (payload, { strategy = 'rename' } = {}) => {
        const importedProfiles = parseImportPayload(payload);
        const now = new Date().toISOString();

        const result: ProfileImportResult = {
          imported: 0,
          overwritten: 0,
          skipped: 0,
          renamed: 0,
        };

        set((state) => {
          const nextProfiles = { ...state.profiles };
          const nextOrder = [...state.profileOrder];
          const nextConnectionTest = { ...state.connectionTest };
          const existingNames = new Set(
            nextOrder
              .map((profileId) => nextProfiles[profileId]?.name?.toLowerCase())
              .filter((name): name is string => Boolean(name))
          );

          for (const incoming of importedProfiles) {
            const targetName = incoming.name;
            const targetLower = targetName.toLowerCase();
            const matchedId = nextOrder.find(
              (profileId) => nextProfiles[profileId]?.name?.toLowerCase() === targetLower
            );

            if (matchedId) {
              if (strategy === 'skip') {
                result.skipped += 1;
                continue;
              }

              if (strategy === 'overwrite') {
                const existing = nextProfiles[matchedId];
                nextProfiles[matchedId] = {
                  ...existing,
                  name: targetName,
                  config: incoming.config,
                  updatedAt: now,
                };
                delete nextConnectionTest[matchedId];
                result.imported += 1;
                result.overwritten += 1;
                continue;
              }
            }

            const finalName =
              matchedId && strategy === 'rename'
                ? getUniqueProfileName(existingNames, targetName)
                : targetName;

            if (!matchedId) {
              existingNames.add(finalName.toLowerCase());
            } else if (strategy === 'rename') {
              result.renamed += 1;
            }

            const id = generateProfileId();
            nextProfiles[id] = {
              id,
              name: finalName,
              config: incoming.config,
              createdAt: now,
              updatedAt: now,
            };
            nextOrder.push(id);
            result.imported += 1;
          }

          return {
            profiles: nextProfiles,
            profileOrder: nextOrder,
            connectionTest: nextConnectionTest,
            activeProfileId: state.activeProfileId ?? nextOrder[0] ?? null,
          };
        });

        return result;
      },

      getActiveProfile: () => {
        const state = get();
        if (!state.activeProfileId) return null;
        return state.profiles[state.activeProfileId] ?? null;
      },

      getActiveConfig: () => {
        const profile = get().getActiveProfile();
        return profile?.config ?? null;
      },
    }),
    {
      name: PROFILES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Failed to rehydrate profile store:', error);
            return;
          }

          if (state && state.profileOrder.length === 0) {
            const migrated = migrateFromLegacyConfig();
            if (migrated) {
              useProfileStore.setState(migrated);
            }
          }
        };
      },
      partialize: (state) => ({
        profiles: state.profiles,
        profileOrder: state.profileOrder,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
);
