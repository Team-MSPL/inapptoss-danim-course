export function getRefundTag(pkg: any): string | null {
  if (!pkg) return null;

  try {
    // 우선 refund_policy_v2.partial_refund 우선 사용, 없으면 pkg.partial_refund 체크
    const partial =
      pkg?.refund_policy_v2?.partial_refund ?? pkg?.partial_refund ?? null;

    if (Array.isArray(partial) && partial.length > 0) {
      // partial 배열 안에 REFUNDABLE 항목이 있는지 확인
      const hasRefundable = partial.some((p: any) =>
        (p?.fee_type === 'REFUNDABLE') ||
        // 일부 응답 구조에서는 fee 배열이 있으면 환불 규칙이 있다는 의미일 수 있음
        (Array.isArray(p?.fee) && p.fee.length > 0)
      );
      if (hasRefundable) return '일부 환불 가능';

      // partial에 NON_REFUNDABLE 만 있는 경우 환불 불가
      const hasNonRefundable = partial.some((p: any) => p?.fee_type === 'NON_REFUNDABLE');
      if (hasNonRefundable && !hasRefundable) return '환불 불가';

      // 그 외 partial이 있으나 정확히 구분하기 어려운 경우 수수료 부과로 표기
      return '수수료 부과';
    }

    // partial 정보가 없을 때 refund_type 필드로 유추
    // (예: refund_type === '1' 이면 수수료 부과 등)
    if (pkg?.refund_type === '1') return '수수료 부과';

    // 기타 케이스: 명확한 정보가 없으면 null 반환(표시 없음)
    return null;
  } catch (err) {
    // 안전하게 실패 처리
    return null;
  }
}

export function firstNLinesFromPackageDesc(pkg: any, n = 3) {
  const list = pkg?.description_module?.PMDL_PACKAGE_DESC?.content?.list;
  if (!Array.isArray(list) || list.length === 0) return [];
  // Each item may have desc HTML - strip tags
  const strips = list.map((it: any) => {
    const raw = typeof it?.desc === 'string' ? it.desc : (it?.desc?.toString?.() ?? '');
    return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }).filter(Boolean);
  return strips.slice(0, n);
}

export function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return '';
  return n.toLocaleString();
}

export function getPriceInfo(pkg: any) {
  // 원가: b2c (권장가) 우선, 없으면 b2b로 대체
  const original = pkg?.b2c_min_price ?? pkg?.b2b_min_price ?? 0;
  // 실제 판매가(할인가): b2b_min_price를 사용하는 경우가 많음
  const display = pkg?.b2b_min_price ?? pkg?.b2c_min_price ?? 0;

  // 할인 계산
  const discountAmount = Math.max(0, (original ?? 0) - (display ?? 0));
  const discountPercent = original > 0 ? Math.round((discountAmount / original) * 100) : 0;

  return {
    original,
    display,
    discountAmount,
    discountPercent,
    hasDiscount: discountAmount > 0
  };
}

export function earliestBookingText(pkg: any) {
  // sale_s_date is typically a string like "2025-10-17"
  const s = pkg?.sale_s_date;
  if (!s) return null;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    // format e.g., "가장 빠른 예약일 10월 12일"
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `가장 빠른 예약일 ${month}월 ${day}일`;
  } catch {
    return null;
  }
}

/**
 * Minimal mapping from UI nationality label (한글) to API locale/state/tel code.
 * Extend this map if you support more countries or different codes.
 */
export function mapNationalityToLocaleState(nat?: string) {
  const map: Record<string, { locale: string; state: string; telCode: string }> = {
    "미국": { locale: "en", state: "US", telCode: "1" },
    "베트남": { locale: "vi", state: "VN", telCode: "84" },
    "태국": { locale: "th", state: "TH", telCode: "66" },
    "일본": { locale: "ja", state: "JP", telCode: "81" },
    "대한민국": { locale: "ko", state: "KR", telCode: "82" },
    "중국": { locale: "zh-cn", state: "CN", telCode: "86" },
    "대만": { locale: "zh-tw", state: "TW", telCode: "886" },
    "홍콩": { locale: "zh-hk", state: "HK", telCode: "852" },
  };
  return map[nat ?? "대한민국"] ?? { locale: "ko", state: "KR", telCode: "82" };
}

/**
 * Helper to build skus array from pkgData and params, attempting to split adult/child SKUs when possible.
 * - Returns array of { sku_id, qty, price } (only these three fields per your request)
 * - price is total price for that SKU (unit * qty)
 */
export function buildSkusFromPkg_v2(pkgData: any, params: any, adultCount: number, childCount: number, salePerPerson: number, totalPriceCalc: number, originalPerPerson?: number) {
  // 1) use params.skus if present (normalize to only sku_id/qty/price)
  if (params?.skus && Array.isArray(params.skus) && params.skus.length > 0) {
    return params.skus.map((s: any) => ({
      sku_id: s.sku_id ?? null,
      qty: Number(s.qty ?? 1),
      price: s.price !== undefined && s.price !== null ? Number(s.price) : 0,
    }));
  }

  // 2) try pkgData.item[0].skus
  const items = pkgData?.item;
  if (Array.isArray(items) && items.length > 0) {
    const item = items[0];
    const candidateSkus = Array.isArray(item.skus) ? item.skus : [];

    if (candidateSkus.length > 0) {
      // helper: extract ticket-kind text from sku object
      const getTicketKindText = (s: any) => {
        const parts: string[] = [];
        if (s.spec && typeof s.spec === 'object') {
          Object.values(s.spec).forEach(v => { if (v) parts.push(String(v)); });
        }
        if (s.specs_ref && Array.isArray(s.specs_ref)) {
          s.specs_ref.forEach((r: any) => {
            if (r.spec_value_desc) parts.push(String(r.spec_value_desc));
            if (r.spec_title_desc) parts.push(String(r.spec_title_desc));
          });
        }
        if (s.title) parts.push(String(s.title));
        if (s.name) parts.push(String(s.name));
        if (s.spec_desc) parts.push(String(s.spec_desc));
        return parts.join(' ').toLowerCase();
      };

      let adultSku: any = null;
      let childSku: any = null;

      for (const s of candidateSkus) {
        const text = getTicketKindText(s);
        // adult detection
        if (!adultSku && (text.includes("성인") || text.includes("adult") || text.includes("어른"))) {
          adultSku = s;
          continue;
        }
        // child detection (includes 중,초 and common korean keywords)
        if (!childSku && (text.includes("아동") || text.includes("어린이") || text.includes("child") || text.includes("중,초") || text.includes("초") || text.includes("중") || text.includes("kid"))) {
          childSku = s;
          continue;
        }
        // treat "고등학생" as child by default
        if (!childSku && text.includes("고등학생")) {
          childSku = s;
          continue;
        }
      }

      const skus: any[] = [];
      const pushSku = (s: any, qty: number) => {
        if (!s || qty <= 0) return;
        const unit = (s.b2b_price ?? s.b2c_price ?? s.price ?? item.b2b_min_price ?? item.b2c_min_price ?? salePerPerson ?? 0);
        skus.push({
          sku_id: s.sku_id ?? null,
          qty,
          price: Math.round(Number(unit) * qty),
        });
      };

      if (adultSku) pushSku(adultSku, adultCount);
      if (childSku) pushSku(childSku, childCount);

      // if found at least one of adult/child SKUs, fill missing group with fallback first candidate if needed
      if (skus.length > 0) {
        if (!adultSku && adultCount > 0) pushSku(candidateSkus[0], adultCount);
        if (!childSku && childCount > 0) pushSku(candidateSkus[0], childCount);
        return skus;
      }

      // if only one sku exists, use combined qty
      if (candidateSkus.length === 1) {
        const s = candidateSkus[0];
        const unit = (s.b2b_price ?? s.b2c_price ?? s.price ?? item.b2b_min_price ?? item.b2c_min_price ?? salePerPerson ?? 0);
        const qty = Math.max(1, adultCount + childCount);
        return [{ sku_id: s.sku_id ?? null, qty, price: Math.round(Number(unit) * qty) }];
      }

      // if multiple SKUs exist but detection failed -> fallback to first sku with combined qty
      if (candidateSkus.length > 0) {
        const s = candidateSkus[0];
        const unit = (s.b2b_price ?? s.b2c_price ?? s.price ?? item.b2b_min_price ?? item.b2c_min_price ?? salePerPerson ?? 0);
        const qty = Math.max(1, adultCount + childCount);
        return [{ sku_id: s.sku_id ?? null, qty, price: Math.round(Number(unit) * qty) }];
      }
    }
  }

  // ultimate fallback
  const totalQty = Math.max(1, adultCount + childCount);
  const unitFallback = salePerPerson ?? Math.round((totalPriceCalc ?? 0) / totalQty) ?? 0;
  return [{ sku_id: params?.sku_id ?? null, qty: totalQty, price: Math.round(unitFallback * totalQty) }];
}

export function buildSkusFromPkg_v3(
  pkgData: any,
  params: any,
  selectedDate: string | null,
  adultCount: number,
  childCount: number,
  salePerPerson: number | undefined,
  totalPriceCalc: number | undefined,
) {
  // normalize params.skus if provided: trust server-provided skus (but still ensure numeric values)
  if (params?.skus && Array.isArray(params.skus) && params.skus.length > 0) {
    return params.skus.map((s: any) => ({
      sku_id: s.sku_id ?? null,
      qty: Number(s.qty ?? 1),
      price: Number(s.price ?? 0),
    }));
  }

  // helpers
  const safeNum = (v: any): number | undefined => {
    if (v == null) return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (typeof v === 'string') {
      const n = Number(v.replace(/,/g, ''));
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const getPriceFromCalendarEntry = (entry: any) => {
    if (!entry) return undefined;
    // prefer b2c_price (or price) for that date; entry may be object with various keys
    const cand = [
      entry?.b2c_price ?? entry?.price ?? entry?.b2b_price ?? entry?.b2c_price,
    ];
    for (const c of cand) {
      const n = safeNum(c);
      if (n !== undefined) return n;
    }
    // sometimes entry holds nested maps; scan values
    if (typeof entry === 'object') {
      for (const v of Object.values(entry)) {
        const n = safeNum(v);
        if (n !== undefined) return n;
      }
    }
    return undefined;
  };

  const getSkuUnitPrice = (sku: any, item: any) => {
    // 1) sku.calendar_detail[selectedDate]
    if (selectedDate) {
      const cal = sku?.calendar_detail ?? sku?.calendar ?? item?.calendar_detail ?? pkgData?.calendar_detail ?? null;
      const entry = cal?.[selectedDate];
      const dPrice = getPriceFromCalendarEntry(entry);
      if (dPrice !== undefined) return dPrice;
    }
    // 2) sku-level b2c/b2b/price
    const skuCandidates = [sku?.b2c_price, sku?.b2b_price, sku?.price];
    for (const c of skuCandidates) {
      const n = safeNum(c);
      if (n !== undefined) return n;
    }
    // 3) item-level calendar_detail_merged[selectedDate]
    if (selectedDate && item?.calendar_detail_merged?.[selectedDate]?.price != null) {
      const n = safeNum(item.calendar_detail_merged[selectedDate].price);
      if (n !== undefined) return n;
    }
    // 4) item-level min prices
    const itemCandidates = [item?.b2c_min_price, item?.b2b_min_price];
    for (const c of itemCandidates) {
      const n = safeNum(c);
      if (n !== undefined) return n;
    }
    // 5) pkg-level fallback
    const pkgCandidates = [pkgData?.pkg?.[0]?.b2c_min_price, pkgData?.pkg?.[0]?.b2b_min_price, pkgData?.b2c_min_price, pkgData?.b2b_min_price];
    for (const c of pkgCandidates) {
      const n = safeNum(c);
      if (n !== undefined) return n;
    }
    // 6) params/sale fallback
    if (salePerPerson !== undefined) return salePerPerson;
    if (totalPriceCalc && (adultCount + childCount) > 0) return Math.round(Number(totalPriceCalc) / Math.max(1, adultCount + childCount));
    return 0;
  };

  const items = pkgData?.item;
  if (!Array.isArray(items) || items.length === 0) {
    // fallback single combined sku
    const qty = Math.max(1, adultCount + childCount);
    const unit = salePerPerson ?? Math.round((totalPriceCalc ?? 0) / qty) ?? 0;
    return [{ sku_id: params?.sku_id ?? null, qty, price: Math.round(unit * qty) }];
  }

  const item = items[0];
  const candidateSkus = Array.isArray(item.skus) ? item.skus : [];

  // extract searchable text from sku for mapping
  const extractText = (s: any) => {
    const parts: string[] = [];
    if (!s) return '';
    if (s.spec && typeof s.spec === 'object') Object.values(s.spec).forEach((v: any) => v && parts.push(String(v)));
    if (s.specs_ref && Array.isArray(s.specs_ref)) {
      s.specs_ref.forEach((r: any) => {
        if (r?.spec_value_desc) parts.push(String(r.spec_value_desc));
        if (r?.spec_title_desc) parts.push(String(r.spec_title_desc));
        if (r?.spec_value_oid) parts.push(String(r.spec_value_oid));
      });
    }
    if (s.ticket_rule_spec_item) parts.push(String(s.ticket_rule_spec_item));
    if (s.title) parts.push(String(s.title));
    if (s.name) parts.push(String(s.name));
    if (s.spec_desc) parts.push(String(s.spec_desc));
    return parts.join(' ').toLowerCase();
  };

  // find exact matches for adult/child
  let adultSku: any = null;
  let childSku: any = null;

  // first pass: exact keywords
  for (const s of candidateSkus) {
    const txt = extractText(s);
    // prefer explicit tokens like "성인"/"어른"/"adult" for adult
    if (!adultSku && (txt.includes('성인') || txt.includes('어른') || txt.includes('adult'))) adultSku = s;
    if (!childSku && (txt.includes('아동') || txt.includes('어린이') || txt.includes('child') || txt.includes('kid') || txt.includes('중,초') || txt.includes('초') || txt.includes('중'))) childSku = s;
    // treat '고등학생' as child (configurable)
    if (!childSku && txt.includes('고등학생')) childSku = s;
  }

  // second pass: try lookups by spec_value_oid or ticket_rule ids if above failed
  if ((!adultSku || !childSku) && candidateSkus.length > 0) {
    for (const s of candidateSkus) {
      if (adultSku && childSku) break;
      // check numeric age-range hints or spec ids
      const txt = extractText(s);
      if (!adultSku && /adult|19|20|성인/.test(txt)) adultSku = s;
      if (!childSku && /(child|kid|유아|아동|어린이|초등|중학생)/.test(txt)) childSku = s;
    }
  }

  // build result
  const result: any[] = [];
  const push = (s: any, qty: number) => {
    if (!s || qty <= 0) return;
    const unit = getSkuUnitPrice(s, item);
    result.push({ sku_id: s.sku_id ?? null, qty, price: Math.round(unit * qty) });
  };

  if (adultSku) push(adultSku, adultCount);
  if (childSku) push(childSku, childCount);

  // if found at least one mapping, fill missing group(s) using first sku as fallback (but preserve qty)
  if (result.length > 0) {
    if (!adultSku && adultCount > 0 && candidateSkus[0]) push(candidateSkus[0], adultCount);
    if (!childSku && childCount > 0 && candidateSkus[0]) push(candidateSkus[0], childCount);
    return result;
  }

  // If only one SKU available -> split qty across that SKU
  if (candidateSkus.length === 1) {
    const s = candidateSkus[0];
    const qty = Math.max(1, adultCount + childCount);
    const unit = getSkuUnitPrice(s, item);
    return [{ sku_id: s.sku_id ?? null, qty, price: Math.round(unit * qty) }];
  }

  // fallback: choose first SKU and set combined qty
  if (candidateSkus.length > 0) {
    const s = candidateSkus[0];
    const qty = Math.max(1, adultCount + childCount);
    const unit = getSkuUnitPrice(s, item);
    return [{ sku_id: s.sku_id ?? null, qty, price: Math.round(unit * qty) }];
  }

  // ultimate fallback
  const totalQty = Math.max(1, adultCount + childCount);
  const unitFb = salePerPerson ?? Math.round((totalPriceCalc ?? 0) / totalQty) ?? 0;
  return [{ sku_id: params?.sku_id ?? null, qty: totalQty, price: Math.round(unitFb * totalQty) }];
}