import { create } from 'zustand';

type MainTabStore = {
  tab: number;
  setTab: (t: number) => void;
};

export const useMainTabStore = create<MainTabStore>((set) => ({
  tab: 0,
  setTab: (t: number) => set({ tab: t }),
}));