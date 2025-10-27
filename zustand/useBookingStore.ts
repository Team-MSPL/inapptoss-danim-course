import { create } from "zustand";

type BookingState = {
  guideLangCode: string | null;
  setGuideLangCode: (code: string | null) => void;

  customMap: Record<string, Record<string, any>>;
  setCustomField: (cusType: string, fieldId: string, value: any) => void;
  setCustomGroup: (cusType: string, values: Record<string, any>) => void;
  resetCustomGroup: (cusType: string) => void;

  // returns array suitable for API: [{ cus_type: 'cus_01', ...fields }, ...]
  getCustomArray: () => Array<Record<string, any>>;
};

const useBookingStore = create<BookingState>((set, get) => ({
  guideLangCode: null,
  setGuideLangCode: (code: string | null) => set({ guideLangCode: code }),

  customMap: {},
  setCustomField: (cusType: string, fieldId: string, value: any) =>
    set((state) => {
      const nextGroup = { ...(state.customMap[cusType] ?? {}), [fieldId]: value };
      return { customMap: { ...state.customMap, [cusType]: nextGroup } };
    }),

  setCustomGroup: (cusType: string, values: Record<string, any>) =>
    set((state) => ({ customMap: { ...state.customMap, [cusType]: { ...(state.customMap[cusType] ?? {}), ...values } } })),

  resetCustomGroup: (cusType: string) =>
    set((state) => {
      const next = { ...state.customMap };
      delete next[cusType];
      return { customMap: next };
    }),

  getCustomArray: () => {
    const map = get().customMap ?? {};
    // Build array but skip groups with no meaningful keys/values
    const arr: Array<Record<string, any>> = [];
    Object.entries(map).forEach(([cusType, fields]) => {
      if (!fields) return;
      // Remove empty-string-only fields
      const cleaned: Record<string, any> = {};
      Object.entries(fields).forEach(([k, v]) => {
        // consider non-empty values only (you can customize this rule)
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          cleaned[k] = v;
        }
      });
      if (Object.keys(cleaned).length > 0) {
        arr.push({ cus_type: cusType, ...cleaned });
      }
    });
    return arr;
  },
}));

export default useBookingStore;