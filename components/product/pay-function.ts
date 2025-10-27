export function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return "";
  return Math.floor(Number(n)).toLocaleString();
}

export function generateGuid() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export function buildSkusFromParams(pkgData: any, params: any, selectedDate: string | null, adultCount: number, childCount: number, adultPriceParam?: number, childPriceParam?: number) {
  const normalizedAdultPrice = adultPriceParam !== undefined ? Number(adultPriceParam) : undefined;
  const normalizedChildPrice = childPriceParam !== undefined ? Number(childPriceParam) : undefined;

  // 둘 다 없는 경우 params 기반 빌드 불가
  if (normalizedAdultPrice === undefined && normalizedChildPrice === undefined) return null;

  const items = pkgData?.item;
  const item = Array.isArray(items) && items.length > 0 ? items[0] : null;
  const candidateSkus = item && Array.isArray(item.skus) ? item.skus : [];

  const extractText = (s: any) => {
    const parts: string[] = [];
    if (!s) return "";
    if (s.spec && typeof s.spec === "object") Object.values(s.spec).forEach((v: any) => v && parts.push(String(v)));
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
    return parts.join(" ").toLowerCase();
  };

  let adultSkuObj: any = null;
  let childSkuObj: any = null;

  for (const s of candidateSkus) {
    const txt = extractText(s);
    if (!adultSkuObj && (txt.includes("성인") || txt.includes("어른") || txt.includes("adult"))) adultSkuObj = s;
    if (!childSkuObj && (txt.includes("아동") || txt.includes("어린이") || txt.includes("child") || txt.includes("kid") || txt.includes("초") || txt.includes("중") || txt.includes("유아"))) childSkuObj = s;
    if (!childSkuObj && txt.includes("고등학생")) childSkuObj = s;
  }

  const firstSku = candidateSkus[0] ?? null;
  const skus: any[] = [];

  if (adultCount > 0) {
    const skuId = (adultSkuObj && adultSkuObj.sku_id) ? adultSkuObj.sku_id : (firstSku && firstSku.sku_id ? firstSku.sku_id : null);
    const unit = normalizedAdultPrice ?? normalizedChildPrice ?? 0;
    skus.push({ sku_id: skuId, qty: adultCount, price: Math.round(unit * adultCount) });
  }
  if (childCount > 0) {
    const skuId = (childSkuObj && childSkuObj.sku_id) ? childSkuObj.sku_id : (firstSku && firstSku.sku_id ? firstSku.sku_id : null);
    const unit = normalizedChildPrice ?? normalizedAdultPrice ?? 0;
    skus.push({ sku_id: skuId, qty: childCount, price: Math.round(unit * childCount) });
  }

  return skus;
}

/**
 * 기본 검증기: payload 전송 전에 필요한 최소 필드 확인
 */
export function validatePayload(payload: any) {
  const errors: string[] = [];
  if (!payload) {
    errors.push("payload가 비어있음");
    return errors;
  }
  if (!payload.prod_no) errors.push("prod_no 누락");
  if (!payload.pkg_no) errors.push("pkg_no 누락");
  if (!payload.item_no) errors.push("item_no 누락");
  if (!payload.buyer_first_name) errors.push("예약자 이름(buyer_first_name) 누락");
  if (!payload.buyer_last_name) errors.push("예약자 성(buyer_last_name) 누락");
  if (!payload.buyer_email) errors.push("이메일(buyer_email) 누락");
  if (!payload.buyer_tel_number) errors.push("전화번호(buyer_tel_number) 누락");
  if (!Array.isArray(payload.skus) || payload.skus.length === 0) errors.push("skus가 비어있거나 형식이 올바르지 않음");
  else {
    payload.skus.forEach((s: any, i: number) => {
      if (!s.sku_id) errors.push(`skus[${i}].sku_id 누락`);
      if (!Number.isFinite(s.qty)) errors.push(`skus[${i}].qty가 숫자가 아님`);
      if (!Number.isFinite(s.price)) errors.push(`skus[${i}].price가 숫자가 아님`);
    });
  }
  return errors;
}
