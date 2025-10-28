import { create } from "zustand";

type BookingState = {
  guideLangCode: string | null;
  setGuideLangCode: (code: string | null) => void;

  customMap: Record<string, Record<string, any>>;
  setCustomField: (cusType: string, fieldId: string, value: any) => void;
  setCustomGroup: (cusType: string, values: Record<string, any>) => void;
  resetCustomGroup: (cusType: string) => void;

  // traffic array (simple type-keyed entries)
  trafficArray: Array<Record<string, any>>;
  setTrafficArray: (arr: Array<Record<string, any>>) => void;
  setTrafficField: (trafficTypeValue: string, fieldId: string, value: any) => void;
  removeTrafficByType: (trafficTypeValue: string) => void;
  resetAll: () => void;

  getCustomArray: () => Array<Record<string, any>>;
  getTrafficArray: () => Array<Record<string, any>>;
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

  // traffic
  trafficArray: [],
  setTrafficArray: (arr: Array<Record<string, any>>) => set(() => ({ trafficArray: arr })),

  /**
   * setTrafficField
   * - trafficTypeValue: ex "flight"
   * - fieldId: ex "arrival_terminalNo"
   * - value: value to set
   *
   * Behavior:
   * - If an entry with traffic_type === trafficTypeValue exists, update that entry's field.
   * - Otherwise push a new entry { traffic_type: trafficTypeValue, [fieldId]: value }.
   */
  setTrafficField: (trafficTypeValue: string, fieldId: string, value: any) =>
    set((state) => {
      const next = [...(state.trafficArray || [])];
      const idx = next.findIndex((it) => String(it?.traffic_type) === String(trafficTypeValue));
      if (idx >= 0) {
        const item = { ...(next[idx] ?? {}) };
        if (value === "" || value === null || typeof value === "undefined") {
          // remove field if empty string/null/undefined
          delete item[fieldId];
        } else {
          item[fieldId] = value;
        }
        next[idx] = item;
      } else {
        const newItem: Record<string, any> = { traffic_type: trafficTypeValue };
        if (!(value === "" || value === null || typeof value === "undefined")) {
          newItem[fieldId] = value;
        }
        next.push(newItem);
      }
      return { trafficArray: next };
    }),

  removeTrafficByType: (trafficTypeValue: string) =>
    set((state) => {
      const next = (state.trafficArray || []).filter((it) => String(it?.traffic_type) !== String(trafficTypeValue));
      return { trafficArray: next };
    }),

  resetAll: () =>
    set(() => ({
      guideLangCode: null,
      customMap: {},
      trafficArray: [],
    })),

  getCustomArray: () => {
    const map = get().customMap ?? {};
    const arr: Array<Record<string, any>> = [];
    Object.entries(map).forEach(([cusType, fields]) => {
      if (!fields) return;
      const cleaned: Record<string, any> = {};
      Object.entries(fields).forEach(([k, v]) => {
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

  getTrafficArray: () => {
    const arr = get().trafficArray ?? [];
    return arr.map((a) => ({ ...a }));
  },
}));

export default useBookingStore;