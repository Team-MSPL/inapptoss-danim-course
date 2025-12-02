import { create } from 'zustand';

type RegionCheckStore = {
  regionCheck: [];
  setRegionCheck: (check: []) => void;
};

export const useRegionCheckStore = create<RegionCheckStore>((set) => ({
  regionCheck: [],
  setRegionCheck: (check) => set({ regionCheck: check }),
}));