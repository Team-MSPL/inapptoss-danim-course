import { create } from 'zustand';

interface ReservationState {
  prod_no: number | null;
  pkg_no: number | null;
  s_date: string | null;
  e_date: string | null;
  setProdNo: (prod_no: number) => void;
  setPkgNo: (pkg_no: number) => void;
  setSDate: (s_date: string) => void;
  setEDate: (e_date: string) => void;
  reset: () => void;
}

export const useReservationStore = create<ReservationState>((set) => ({
  prod_no: null,
  pkg_no: null,
  s_date: null,
  e_date: null,
  setProdNo: (prod_no) => set({ prod_no }),
  setPkgNo: (pkg_no) => set({ pkg_no }),
  setSDate: (s_date) => set({ s_date }),
  setEDate: (e_date) => set({ e_date }),
  reset: () => set({ prod_no: null, pkg_no: null, s_date: null, e_date: null }),
}));