import { create } from "zustand";

type BookingState = {
  guideLangCode: string | null;
  setGuideLangCode: (code: string | null) => void;

  customMap: Record<string, Record<string, any>>;
  setCustomField: (cusType: string, fieldId: string, value: any) => void;
  setCustomGroup: (cusType: string, values: Record<string, any>) => void;
  resetCustomGroup: (cusType: string) => void;

  // buyer basic info (always collected)
  buyer_first_name: string;
  setBuyerFirstName: (v: string) => void;
  buyer_last_name: string;
  setBuyerLastName: (v: string) => void;
  buyer_Email: string;
  setBuyerEmail: (v: string) => void;
  buyer_tel_country_code: string | number;
  setBuyerTelCountryCode: (v: string | number) => void;
  buyer_tel_number: string;
  setBuyerTelNumber: (v: string) => void;
  buyer_country: string;
  setBuyerCountry: (v: string) => void;
  getBuyerObject: () => Record<string, any>;

  // traffic array (internal storage includes spec_index)
  trafficArray: Array<Record<string, any>>;
  setTrafficArray: (arr: Array<Record<string, any>>) => void;
  setTrafficField: (trafficTypeValue: string, fieldId: string, value: any, specIndex?: number) => void;
  removeTrafficByType: (trafficTypeValue: string) => void;
  resetAll: () => void;

  // getters
  getCustomArray: () => Array<Record<string, any>>;
  getTrafficArray: () => Array<Record<string, any>>; // sanitized for API (no internal keys)
  getRawTrafficArray: () => Array<Record<string, any>>; // internal raw copy (includes spec_index)
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

  // buyer basic info (always collected)
  buyer_first_name: "",
  setBuyerFirstName: (v: string) => set((s) => ({ ...s, buyer_first_name: v })),

  buyer_last_name: "",
  setBuyerLastName: (v: string) => set((s) => ({ ...s, buyer_last_name: v })),

  buyer_Email: "",
  setBuyerEmail: (v: string) => set((s) => ({ ...s, buyer_Email: v })),

  buyer_tel_country_code: "" as string | number,
  setBuyerTelCountryCode: (v: string | number) => set((s) => ({ ...s, buyer_tel_country_code: v })),

  buyer_tel_number: "",
  setBuyerTelNumber: (v: string) => set((s) => ({ ...s, buyer_tel_number: v })),

  buyer_country: "",
  setBuyerCountry: (v: string) => set((s) => ({ ...s, buyer_country: v })),

  getBuyerObject: () => {
    const st = get();
    const b: Record<string, any> = {};
    if (st.buyer_first_name && String(st.buyer_first_name).trim() !== "") b.buyer_first_name = st.buyer_first_name;
    if (st.buyer_last_name && String(st.buyer_last_name).trim() !== "") b.buyer_last_name = st.buyer_last_name;
    if (st.buyer_Email && String(st.buyer_Email).trim() !== "") b.buyer_Email = st.buyer_Email;
    if (
      st.buyer_tel_country_code !== undefined &&
      st.buyer_tel_country_code !== null &&
      String(st.buyer_tel_country_code).trim() !== ""
    )
      b.buyer_tel_country_code = st.buyer_tel_country_code;
    if (st.buyer_tel_number && String(st.buyer_tel_number).trim() !== "") b.buyer_tel_number = st.buyer_tel_number;
    if (st.buyer_country && String(st.buyer_country).trim() !== "") b.buyer_country = st.buyer_country;
    return b;
  },

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
        idx = next.findIndex(
          (it) => String(it?.traffic_type) === String(trafficTypeValue) && Number(it?.spec_index) === specIndex
        );
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
      buyer_first_name: "",
      buyer_last_name: "",
      buyer_Email: "",
      buyer_tel_country_code: "",
      buyer_tel_number: "",
      buyer_country: "",
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

  /**
   * getTrafficArray
   * Returns a sanitized copy of trafficArray intended for API payload:
   * - strips internal keys such as spec_index
   * - removes undefined/null/"" fields (keeps 0 and false)
   */
  getTrafficArray: () => {
    const arr = get().trafficArray ?? [];
    return arr
      .map((a) => {
        const copy: Record<string, any> = { ...(a ?? {}) };
        // remove internal-only keys
        delete copy.spec_index;
        // remove any other internal properties here if needed
        // sanitize: remove undefined / null / empty-string (trimmed)
        const cleaned: Record<string, any> = {};
        Object.entries(copy).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (typeof v === "string" && v.trim() === "") return;
          cleaned[k] = v;
        });
        return cleaned;
      })
      .filter((t) => Object.keys(t).length > 0);
  },

  // raw internal copy (keeps spec_index) - useful for debugging
  getRawTrafficArray: () => {
    const arr = get().trafficArray ?? [];
    return arr.map((a) => ({ ...(a ?? {}) }));
  },
}));

export default useBookingStore;