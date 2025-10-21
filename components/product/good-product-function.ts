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