import { create } from 'zustand';

type RegionMode = 'enroll' | 'join';

type RegionModeStore = {
  regionMode: RegionMode;
  setRegionMode: (mode: RegionMode) => void;
};

export const useRegionModeStore = create<RegionModeStore>((set) => ({
  regionMode: 'enroll', // 기본값을 enroll로 설정
  setRegionMode: (mode) => set({ regionMode: mode }),
}));