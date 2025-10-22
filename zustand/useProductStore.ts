import { create } from 'zustand';

type ProductStore = {
  pdt: any | null;
  setPdt: (p: any | null) => void;
  clear: () => void;
};

export const useProductStore = create<ProductStore>((set) => ({
  pdt: null,
  setPdt: (p) => set(() => ({ pdt: p })),
  clear: () => set(() => ({ pdt: null })),
}));