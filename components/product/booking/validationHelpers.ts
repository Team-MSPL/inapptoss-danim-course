import useBookingStore from "../../../zustand/useBookingStore";

/**
 * validationHelpers.ts
 * Exports:
 * - readCustomValue(rawFields, cusType, fieldId)
 * - findStoredTrafficEntry(rawFields, trafficType, specIndex)
 * - isFilled(v)
 * - getRequiredCustomFields(rawFields, cusType)
 * - getRequiredTrafficEntries(rawFields, typesArr)
 * - validateCustomSection(rawFields, cusType)
 * - validateTrafficSection(rawFields, typesArr)
 * - validateSectionBuilt(rawFields, requiredMap)
 * - validateSection(rawFields, options)
 *
 * NOTE: paths/useBookingStore import may need adjustment depending on your repo layout.
 */

/* 1) util: isFilled */
export function isFilled(v: any) {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  return true; // number/boolean considered filled
}

/* 2) readCustomValue: tolerant reader that checks booking store's customMap/getCustomArray */
export function readCustomValue(rawFields: any, cusType: string, fieldId: string) {
  const store = useBookingStore.getState();
  // direct map
  const group = store.customMap?.[cusType];
  if (group && Object.prototype.hasOwnProperty.call(group, fieldId)) return group[fieldId];

  // check getCustomArray entry
  const arr = store.getCustomArray ? store.getCustomArray() : [];
  const entry = Array.isArray(arr) ? arr.find((e) => String(e?.cus_type) === String(cusType)) : undefined;
  if (entry && Object.prototype.hasOwnProperty.call(entry, fieldId)) return entry[fieldId];

  // tolerant variants
  const variants = [fieldId, fieldId.replace(/_([a-z])/g, (m: string, p1: string) => p1.toUpperCase()), fieldId.replace(/_/g, "")];
  if (group) {
    for (const v of variants) if (Object.prototype.hasOwnProperty.call(group, v)) return group[v];
  }
  if (entry) {
    for (const v of variants) if (Object.prototype.hasOwnProperty.call(entry, v)) return entry[v];
  }
  return undefined;
}

/* 3) findStoredTrafficEntry: prefer rawTraffic, performs exact/spec-index/occurrence mapping */
export function findStoredTrafficEntry(rawFields: any, trafficType: string, specIndex?: number) {
  const store = useBookingStore.getState();
  const rawTraffic = (store as any).getRawTrafficArray ? (store as any).getRawTrafficArray() : store.getTrafficArray();
  if (!Array.isArray(rawTraffic)) return undefined;

  // 1) exact by spec_index
  if (typeof specIndex === "number") {
    const exact = rawTraffic.find((r: any) => String(r?.traffic_type) === String(trafficType) && Number(r?.spec_index) === Number(specIndex));
    if (exact) return exact;
  }

  // 2) map by occurrence order
  const storedByType: any[] = rawTraffic.filter((r: any) => String(r?.traffic_type) === String(trafficType));
  if (storedByType.length === 0) return undefined;

  if (typeof specIndex === "number") {
    // compute occurrence index of this spec in rawFields
    let occurrence = 0;
    for (let i = 0; i <= specIndex && i < (rawFields?.traffics?.length ?? 0); i++) {
      if (String(rawFields.traffics[i]?.traffic_type?.traffic_type_value) === String(trafficType)) {
        if (i === specIndex) break;
        occurrence++;
      }
    }
    if (storedByType.length > occurrence) return storedByType[occurrence];
  }

  // 3) fallback: first stored entry of that type
  return storedByType[0];
}

/* 4) getRequiredCustomFields */
export function getRequiredCustomFields(rawFields: any, cusType: string) {
  if (!rawFields?.custom) return [];
  const fields: string[] = [];
  Object.entries(rawFields.custom).forEach(([fieldId, specObj]: any) => {
    const useArr = specObj?.use ?? [];
    if (!Array.isArray(useArr) || !useArr.includes(cusType)) return;
    const isReq = String(specObj?.is_require ?? "").toLowerCase() === "true";
    if (isReq) fields.push(fieldId);
  });
  return fields;
}

/* 5) getRequiredTrafficEntries */
export function getRequiredTrafficEntries(rawFields: any, typesArr: string[]) {
  const required: Array<{ traffic_type: string; spec_index?: number; fieldId: string }> = [];
  if (!Array.isArray(rawFields?.traffics)) return required;

  rawFields.traffics.forEach((spec: any, specIndex: number) => {
    const t = spec?.traffic_type?.traffic_type_value;
    if (!t || !typesArr.includes(t)) return;
    Object.entries(spec).forEach(([fieldId, fieldSpec]: any) => {
      if (fieldId === "traffic_type") return;
      if (!fieldSpec || typeof fieldSpec !== "object") return;
      const isReq = String(fieldSpec?.is_require ?? "").toLowerCase() === "true";
      if (isReq) required.push({ traffic_type: t, spec_index: specIndex, fieldId });
    });
  });

  return required;
}

/* 6) validateCustomSection */
export function validateCustomSection(rawFields: any, cusType: string) {
  const missing: string[] = [];
  const reqFields = getRequiredCustomFields(rawFields, cusType);
  if (reqFields.length === 0) return missing;

  const arr = useBookingStore.getState().getCustomArray() ?? [];
  const entry = arr.find(e => String(e?.cus_type) === String(cusType));
  if (!entry) {
    reqFields.forEach(f => missing.push(`${cusType} - ${f}`));
    return missing;
  }
  reqFields.forEach((f) => {
    if (!isFilled(entry[f])) missing.push(`${cusType} - ${f}`);
  });
  return missing;
}

/* 7) validateTrafficSection */
export function validateTrafficSection(rawFields: any, typesArr: string[]) {
  const missing: string[] = [];
  const requiredEntries = getRequiredTrafficEntries(rawFields, typesArr);
  if (requiredEntries.length === 0) return missing;

  const store = useBookingStore.getState();
  const rawTraffic = (store as any).getRawTrafficArray ? (store as any).getRawTrafficArray() : store.getTrafficArray();
  if (!Array.isArray(rawTraffic)) return missing;

  // group stored entries by traffic_type in insertion order
  const storedByType: Record<string, any[]> = {};
  rawTraffic.forEach((r: any) => {
    const t = String(r?.traffic_type ?? "");
    if (!storedByType[t]) storedByType[t] = [];
    storedByType[t].push(r);
  });

  requiredEntries.forEach((req) => {
    const t = String(req.traffic_type);

    // 1) exact match by traffic_type + spec_index if possible
    let match = rawTraffic.find((r: any) => String(r?.traffic_type) === t && (typeof req.spec_index === "number" ? Number(r?.spec_index) === Number(req.spec_index) : true));

    // 2) occurrence mapping
    if (!match) {
      let occurrenceIndex = 0;
      if (Array.isArray(rawFields?.traffics)) {
        let count = 0;
        for (let i = 0; i <= (req.spec_index ?? rawFields.traffics.length - 1); i++) {
          const s = rawFields.traffics[i];
          if (!s) continue;
          if (String(s?.traffic_type?.traffic_type_value) === t) {
            if (i === req.spec_index) {
              occurrenceIndex = count;
              break;
            }
            count++;
          }
        }
      }
      const storedList = storedByType[t] ?? [];
      if (storedList.length > occurrenceIndex) {
        match = storedList[occurrenceIndex];
      }
    }

    // 3) fallback
    if (!match) {
      const anyMatch = (rawTraffic || []).find((r: any) => String(r?.traffic_type) === t);
      if (anyMatch) match = anyMatch;
    }

    const foundVal = match ? match[req.fieldId] : undefined;
    if (!isFilled(foundVal)) {
      missing.push(`${t} - ${req.fieldId}`);
    }
  });

  return missing;
}

/* 8) validateSectionBuilt (uses readCustomValue/findStoredTrafficEntry/isFilled) */
export function validateSectionBuilt(rawFields: any, requiredMap: Record<number, Array<any>>) {
  const missing: string[] = [];
  const listForSection = (idx: number) => requiredMap[idx] ?? [];

  // We'll build missing for every section caller asks for, but keep same signature: caller should provide the right sectionIndex via loop
  // For convenience, return a function that validates one section:
  return (sectionIndex: number) => {
    const localMissing: string[] = [];
    const list = listForSection(sectionIndex);
    list.forEach((req: any) => {
      if (req.cusType) {
        const val = readCustomValue(rawFields, req.cusType, req.key);
        if (!isFilled(val)) localMissing.push(req.label || req.key);
      } else if (req.trafficType) {
        const entry = findStoredTrafficEntry(rawFields, req.trafficType, req.specIndex);
        const val = entry ? entry[req.key] : undefined;
        if (!isFilled(val)) localMissing.push(req.label || `${req.trafficType}.${req.key}`);
      } else {
        const st = useBookingStore.getState();
        const val = (req.key === "guide_lang") ? st.guideLangCode : (st as any)[req.key];
        if (!isFilled(val)) localMissing.push(req.label || req.key);
      }
    });
    return localMissing;
  };
}

/**
 * validateSection (flexible runner)
 * - options should contain flags used in the switch (hasCus01, hasCus02, hasContact, hasSend, hasFlight, hasPsgQty, hasRentcar01, hasRentcar02, hasRentcar03, hasPickup03, hasPickup04, hasVoucher)
 * - rawFields required for traffics/customs
 */
export function validateSection(rawFields: any, sectionIndex: number, options: any) : string[] {
  const miss: string[] = [];
  const {
    hasCus01, hasCus02, hasContact, hasSend,
    hasFlight, hasPsgQty,
    hasRentcar01, hasRentcar02, hasRentcar03,
    hasPickup03, hasPickup04,
    hasVoucher,
  } = options ?? {};

  switch (sectionIndex) {
    case 1: {
      const st = useBookingStore.getState();
      if (!isFilled(st.buyer_last_name)) miss.push("구매자 성 (Last name)");
      if (!isFilled(st.buyer_first_name)) miss.push("구매자 이름 (First name)");
      if (!isFilled(st.buyer_Email) && !isFilled((st as any).buyer_email)) miss.push("이메일");
      if (!isFilled(st.buyer_tel_number)) miss.push("전화번호");
      if (!isFilled(st.buyer_country)) miss.push("국가 코드");
      break;
    }
    case 2: {
      if (rawFields?.guide_lang) {
        const isReq = String(rawFields.guide_lang?.is_require ?? "true").toLowerCase() === "true";
        if (isReq && !isFilled(useBookingStore.getState().guideLangCode)) {
          miss.push("가이드 언어 선택");
        }
      }
      break;
    }
    case 3: {
      if (hasCus01) miss.push(...validateCustomSection(rawFields, "cus_01"));
      break;
    }
    case 4: {
      if (hasCus02) miss.push(...validateCustomSection(rawFields, "cus_02"));
      break;
    }
    case 5: {
      if (hasContact) miss.push(...validateCustomSection(rawFields, "contact"));
      break;
    }
    case 6: {
      if (hasSend) miss.push(...validateCustomSection(rawFields, "send"));
      break;
    }
    case 7: {
      if (hasFlight) miss.push(...validateTrafficSection(rawFields, ["flight"]));
      break;
    }
    case 8: {
      if (hasPsgQty) miss.push(...validateTrafficSection(rawFields, ["psg_qty"]));
      break;
    }
    case 9: {
      const types: string[] = [];
      if (hasRentcar01) types.push("rentcar_01");
      if (hasRentcar02) types.push("rentcar_02");
      if (hasRentcar03) types.push("rentcar_03");
      if (types.length) miss.push(...validateTrafficSection(rawFields, types));
      break;
    }
    case 10: {
      const types: string[] = [];
      if (hasPickup03) types.push("pickup_03");
      if (hasPickup04) types.push("pickup_04");
      if (types.length) miss.push(...validateTrafficSection(rawFields, types));
      break;
    }
    case 11: {
      if (hasVoucher) miss.push(...validateTrafficSection(rawFields, ["voucher"]));
      break;
    }
    default:
      break;
  }

  return miss;
}