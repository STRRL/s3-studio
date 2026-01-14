import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { S3Config, S3Profile, ConnectionTestResult } from '@/lib/types';
import { generateProfileId, LEGACY_STORAGE_KEY } from '@/lib/storage';

const PROFILES_STORAGE_KEY = 's3-studio-profiles';

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
          const { [id]: removed, ...remainingProfiles } = state.profiles;
          const newOrder = state.profileOrder.filter((pid) => pid !== id);
          const newActiveId =
            state.activeProfileId === id ? (newOrder[0] ?? null) : state.activeProfileId;

          const { [id]: removedTest, ...remainingTests } = state.connectionTest;

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
          const { [profileId]: removed, ...rest } = state.connectionTest;
          return { connectionTest: rest };
        });
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
