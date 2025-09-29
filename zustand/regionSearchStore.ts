import { create } from 'zustand';

interface RegionSearchState {
  selectList: number[][];
  selectPopular: number[];
  recentPosition: { lat: number; lng: number };
  distanceSensitivity: number;
  version: number;
  country: string;
  setSelectList: (list: number[][]) => void;
  setSelectPopular: (popular: number[]) => void;
  setRecentPosition: (pos: { lat: number; lng: number }) => void;
  setDistanceSensitivity: (value: number) => void;
  reset: () => void;
}

export const useRegionSearchStore = create<RegionSearchState>((set) => ({
  selectList: [],
  selectPopular: [],
  recentPosition: { lat: 0, lng: 0 },
  distanceSensitivity: -1,
  version: 2,
  country: 'Korea',
  setSelectList: (list) => set({ selectList: list }),
  setSelectPopular: (popular) => set({ selectPopular: popular }),
  setRecentPosition: (pos) => set({ recentPosition: pos }),
  setDistanceSensitivity: (value) => set({ distanceSensitivity: value }),
  reset: () =>
    set({
      selectList: [],
      selectPopular: [],
      recentPosition: { lat: 0, lng: 0 },
      distanceSensitivity: -1,
      version: 2,
      country: 'Korea',
    }),
}));