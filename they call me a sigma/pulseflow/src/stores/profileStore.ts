import { create } from 'zustand';
import { AthleteProfile, DeviceState } from '../types';
import { getProfile, upsertProfile } from '../db/profileRepository';

type ProfileStore = {
  profile: AthleteProfile | null;
  device: DeviceState;
  loadProfile: () => void;
  saveProfile: (profile: AthleteProfile) => void;
  setDevice: (device: Partial<DeviceState>) => void;
  resetDevice: () => void;
};

const DEFAULT_DEVICE: DeviceState = {
  connected: false,
  batteryPercent: null,
  firmwareVersion: null,
  lastSyncTimestamp: null,
  rssi: null,
  simulated: false,
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  device: DEFAULT_DEVICE,

  loadProfile() {
    const result = getProfile();
    if (result.ok && result.value) {
      set({ profile: result.value });
    }
  },

  saveProfile(profile) {
    upsertProfile(profile);
    set({ profile });
  },

  setDevice(partial) {
    set((state) => ({ device: { ...state.device, ...partial } }));
  },

  resetDevice() {
    set({ device: DEFAULT_DEVICE });
  },
}));
