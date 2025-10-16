/**
 * KKday product_category.main, sub 배열 → 한글명 배열로 변환
 */

const KKDAY_CATEGORY_KO_MAP: Record<string, string> = {
  CATEGORY_001: '티켓',
  CATEGORY_002: '전망대',
  CATEGORY_003: '자연 경치',
  CATEGORY_004: '박물관&미술관',
  CATEGORY_005: '수족관&동물원',
  CATEGORY_006: '놀이공원',
  CATEGORY_007: '역사테마관광지',
  CATEGORY_008: '농장&공장투어',
  CATEGORY_009: '파크&정원',
  CATEGORY_010: '실내 활동',
  CATEGORY_011: '관광패스',
  CATEGORY_012: '이벤트',
  CATEGORY_013: '스포츠 이벤트',
  CATEGORY_014: '쇼&뮤지컬',
  CATEGORY_015: '콘서트&연예인 이벤트',
  CATEGORY_016: '전시회',
  CATEGORY_017: '축제&카니발',
  CATEGORY_018: '투어&체험',
  CATEGORY_019: '투어',
  CATEGORY_020: '반나절/데이 투어',
  CATEGORY_021: '다일 투어',
  CATEGORY_022: '보트&요트 투어',
  CATEGORY_023: '관광버스',
  CATEGORY_024: '에어버스',
  CATEGORY_025: '워킹 투어',
  CATEGORY_026: '하이킹 투어',
  CATEGORY_027: '쇼핑 투어',
  CATEGORY_028: '미식 투어',
  CATEGORY_029: '바이크 투어',
  CATEGORY_030: '생태 투어',
  CATEGORY_031: '야외&스포츠 투어',
  CATEGORY_032: '스노우 액티비티',
  CATEGORY_033: '수상활동',
  CATEGORY_034: '하이킹&등산',
  CATEGORY_035: '캠핑',
  CATEGORY_036: '피트니스',
  CATEGORY_037: '익스트림스포츠',
  CATEGORY_038: '스카이다이빙',
  CATEGORY_039: '패러글라이딩',
  CATEGORY_040: '열기구',
  CATEGORY_041: '낚시',
  CATEGORY_042: '오로라',
  CATEGORY_043: '릴랙스&뷰티',
  CATEGORY_044: '스파&마사지',
  CATEGORY_045: '뷰티&스킨 케어',
  CATEGORY_046: '온천',
  CATEGORY_047: '문화 체험',
  CATEGORY_048: '워킹샵',
  CATEGORY_049: '쿠킹클래스',
  CATEGORY_050: '의복대여',
  CATEGORY_051: '사진촬영체험',
  CATEGORY_052: '크루즈',
  CATEGORY_053: '크루즈',
  CATEGORY_054: '항공권+크루즈',
  CATEGORY_055: '교통',
  CATEGORY_056: '열차',
  CATEGORY_057: 'T Holiday',
  CATEGORY_058: '기타 교통 수단',
  CATEGORY_059: '교통카드&패스',
  CATEGORY_060: '일본 JR패스',
  CATEGORY_061: '유레일패스',
  CATEGORY_062: '기타 교통 패스',
  CATEGORY_063: '공항 픽업/샌딩',
  CATEGORY_064: '프라이빗 픽업/샌딩',
  CATEGORY_065: '공항철도&버스',
  CATEGORY_066: '페리',
  CATEGORY_067: '버스',
  CATEGORY_068: '전세 차량',
  CATEGORY_069: '프라이빗 차량',
  CATEGORY_070: '카풀',
  CATEGORY_071: '기타 전세 차량 서비스',
  CATEGORY_072: '렌트카',
  CATEGORY_073: '항공권',
  CATEGORY_074: '항공권',
  CATEGORY_075: '항공권+호텔',
  CATEGORY_076: '항공권+투어&티켓',
  CATEGORY_077: '항공권+단체 투어',
  CATEGORY_078: '숙소',
  CATEGORY_079: '미식',
  CATEGORY_080: '와이파이&심카드',
  CATEGORY_081: '이심',
  CATEGORY_082: '심카드',
  CATEGORY_083: '와이파이',
  CATEGORY_084: '여행 서비스',
  CATEGORY_085: '비자&여권',
  CATEGORY_086: '수하물 서비스',
  CATEGORY_087: '공항 서비스',
  CATEGORY_088: '기타 여행 서비스',
  CATEGORY_089: '쇼핑',
  CATEGORY_090: '쇼핑 쿠폰',
  CATEGORY_091: '바우처',
  CATEGORY_092: '특산물',
  CATEGORY_093: '신선식품',
  CATEGORY_094: '골프',
  CATEGORY_095: '바이크 렌탈',
};

export function parseKkdayCategoryKorean(productCategory: { main?: string; sub?: string[] }): string[] {
  const result: string[] = [];
  if (productCategory?.main && KKDAY_CATEGORY_KO_MAP[productCategory.main]) {
    result.push(KKDAY_CATEGORY_KO_MAP[productCategory.main]);
  }
  if (productCategory?.sub && Array.isArray(productCategory.sub)) {
    for (const sub of productCategory.sub) {
      if (KKDAY_CATEGORY_KO_MAP[sub]) {
        result.push(KKDAY_CATEGORY_KO_MAP[sub]);
      }
    }
  }
  return result;
}

// 사용 예시
// const cat = { main: "CATEGORY_001", sub: ["CATEGORY_002", "CATEGORY_003"] }
// parseKkdayCategoryKorean(cat) // 결과: ['티켓', '전망대', '자연 경치']