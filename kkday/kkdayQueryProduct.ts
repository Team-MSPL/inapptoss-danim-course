import axios from "axios";

/**
 * KKday 상품 상세 조회 (QueryProduct API)
 * @param prod_no 상품 번호 (int)
 * @param locale 언어코드 예: "zh-tw"
 * @param state 국가코드 예: "TW"
 * @param jwtToken Authorization용 JWT 토큰
 * @returns API 응답(json)
 */
export async function queryProductDetail(prod_no: number, locale: string, state: string, jwtToken: string) {
  const API_URL = 'https://api-b2d.kkday.com/v4/Product/QueryProduct';
  const body = {
    prod_no,
    locale,
    state,
  };

  try {
    const response = await axios.post(API_URL, body, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      }
    });
    console.log('[KKday QueryProduct 응답]', response.data);
    return response.data;
  } catch (e: any) {
    if (e.response) {
      console.error('[KKday QueryProduct 에러]', e.response.status, e.response.data);
    } else {
      console.error('[KKday QueryProduct 에러]', e);
    }
    throw e;
  }
}