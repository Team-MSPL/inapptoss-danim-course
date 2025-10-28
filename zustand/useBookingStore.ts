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
  setTrafficField: (trafficTypeValue: string, fieldId: string, value: any, specIndex?: number) => void;
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
   * - If an entry with traffic_type === trafficTypeValue exists (and spec_index matches when provided), update that entry's field.
   * - Otherwise push a new entry { traffic_type: trafficTypeValue, spec_index?: specIndex, [fieldId]: value }.
   *
   * Safety:
   * - If the requested update would not change the stored value (same value), do nothing to avoid unnecessary re-renders/loops.
   * - If attempting to create a new entry with an empty value (""/null/undefined), do nothing.
   */
  setTrafficField: (trafficTypeValue: string, fieldId: string, value: any, specIndex?: number) =>
    set((state) => {
      const next = [...(state.trafficArray || [])];

      // find by type + spec_index (if specIndex provided) otherwise fallback to first matching type
      let idx = -1;
      if (typeof specIndex === "number") {
        idx = next.findIndex((it) => String(it?.traffic_type) === String(trafficTypeValue) && Number(it?.spec_index) === specIndex);
      } else {
        idx = next.findIndex((it) => String(it?.traffic_type) === String(trafficTypeValue));
      }

      // helper to test emptiness
      const isEmpty = (v: any) => v === "" || v === null || typeof v === "undefined";

      if (idx >= 0) {
        const existing = next[idx] ?? {};
        const existingVal = existing[fieldId];

        // If no-op (existing value equals requested), do nothing
        // Compare as strings for lenient equality on primitives; handle undefined/null/empty uniformly
        const existingIsEmpty = isEmpty(existingVal);
        const requestedIsEmpty = isEmpty(value);

        if (existingIsEmpty && requestedIsEmpty) {
          // nothing to change
          return { trafficArray: state.trafficArray };
        }
        if (!existingIsEmpty && !requestedIsEmpty && String(existingVal) === String(value)) {
          // value identical, nothing to change
          return { trafficArray: state.trafficArray };
        }

        // perform update (modify only if truly changed)
        const item = { ...(next[idx] ?? {}) };
        if (requestedIsEmpty) {
          // delete field if requested to clear
          if (Object.prototype.hasOwnProperty.call(item, fieldId)) {
            delete item[fieldId];
            next[idx] = item;
            return { trafficArray: next };
          } else {
            // field not present, nothing to change
            return { trafficArray: state.trafficArray };
          }
        } else {
          item[fieldId] = value;
          next[idx] = item;
          return { trafficArray: next };
        }
      } else {
        // creating new item
        // If requested value is empty, do nothing (avoid creating empty entries)
        const isValEmpty = isEmpty(value);
        if (isValEmpty) {
          return { trafficArray: state.trafficArray };
        }
        const newItem: Record<string, any> = { traffic_type: trafficTypeValue };
        if (typeof specIndex === "number") newItem.spec_index = specIndex;
        newItem[fieldId] = value;
        next.push(newItem);
        return { trafficArray: next };
      }
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