import { create } from 'zustand';

type RegionMode = 'enroll' | 'join';

type RecentMode = 'recent' | 'current';

type RecentModeStore = {
  recentMode: RecentMode;
  setRecentMode: (mode: RecentMode) => void;
}
type RegionModeStore = {
  regionMode: RegionMode;
  setRegionMode: (mode: RegionMode) => void;
};

export const useRegionModeStore = create<RegionModeStore>((set) => ({
  regionMode: 'enroll', // 기본값을 enroll로 설정
  setRegionMode: (mode) => set({ regionMode: mode }),
}));

export const useRecentModeStore = create<RecentModeStore>((set) => ({
  recentMode: 'current',
  setRecentMode: (mode) => set({ recentMode: mode }),
}))