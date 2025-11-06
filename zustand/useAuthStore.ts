import { create } from "zustand";

type AuthState = {
  userKey: string | null;
  setUserKey: (key: string | null) => void;
  clear: () => void;
};

const useAuthStore = create<AuthState>((set) => ({
  userKey: null,
  setUserKey: (key) => set({ userKey: key }),
  clear: () => set({ userKey: null }),
}));

export default useAuthStore;