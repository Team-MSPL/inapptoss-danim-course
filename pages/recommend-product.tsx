import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import {
  colors,
  Text,
  Button,
  Skeleton,
  AnimateSkeleton,
  FixedBottomCTAProvider,
  FixedBottomCTA,
  Top,
} from '@toss-design-system/react-native';
import axiosAuth from "../redux/api";
import { getRecentSelectList } from "../zustand/api";
import ProductCardLarge, { Product } from "../components/main/product-card-large";
import useRecommendStore from "../zustand/recommendStore";
import { useAppSelector } from "../src/store";
import { useRegionCheckStore } from "../zustand/timetableStore";

export const Route = createRoute('/recommend-product', {
  validateParams: (params) => params,
  component: RecommendProduct,
});

const RECOMMEND_API_URL = `${import.meta.env.API_ROUTE_RELEASE ?? ''}/sellingProduct/recommend`;

/* helpers (flatten/extract) - unchanged from before */
function flattenArray(arr: any[]): any[] {
  const out: any[] = [];
  (function f(a: any[]) {
    for (const v of a) {
      if (Array.isArray(v)) f(v);
      else out.push(v);
    }
  })(arr);
  return out;
}

function extract2DArray(maybe: any): any[] | null {
  if (!maybe) return null;
  if (Array.isArray(maybe) && maybe.length > 0 && Array.isArray(maybe[0])) return maybe;
  if (typeof maybe === 'object') {
    if (Array.isArray((maybe as any).recentSelectList) && (maybe as any).recentSelectList.length > 0 && Array.isArray((maybe as any).recentSelectList[0])) {
      return (maybe as any).recentSelectList;
    }
    if (Array.isArray((maybe as any).selectList) && (maybe as any).selectList.length > 0 && Array.isArray((maybe as any).selectList[0])) {
      return (maybe as any).selectList;
    }
    for (const v of Object.values(maybe)) {
      if (Array.isArray(v) && v.length > 0 && Array.isArray((v as any)[0])) return v as any[];
    }
  }
  return null;
}

function extractProductsFromResponse(res: any): any[] {
  if (!res) return [];

  if (Array.isArray(res)) {
    if (res.length === 1 && Array.isArray(res[0])) {
      return res[0].filter((it: any) => it && typeof it === 'object' && !Array.isArray(it));
    }
    const flat = (res as any).flat ? (res as any).flat(Infinity) : flattenArray(res);
    return flat.filter((it: any) => it && typeof it === 'object' && !Array.isArray(it));
  }

  if (res.prods && Array.isArray(res.prods)) return res.prods;
  if (res.products && Array.isArray(res.products)) return res.products;
  if (res.data && Array.isArray(res.data)) {
    const flat = (res.data as any).flat ? (res.data as any).flat(Infinity) : flattenArray(res.data);
    return flat.filter((it: any) => it && typeof it === 'object' && !Array.isArray(it));
  }

  const maybeArrays = Object.values(res).filter(v => Array.isArray(v));
  if (maybeArrays.length > 0) {
    const flat = maybeArrays.flatMap(a => (a as any).flat ? (a as any).flat(Infinity) : flattenArray(a));
    return flat.filter((it: any) => it && typeof it === 'object' && !Array.isArray(it));
  }

  return [];
}

function mapRecommendItemToProduct(item: any, idx: number): Product {
  return {
    prod_no: item.prod_no ?? item._id ?? item.prodNo ?? `idx_${idx}`,
    prod_name: item.prod_name ?? item.prodName ?? item.name ?? '',
    prod_img_url: item.prod_img_url ?? item.prod_img ?? item.prodImg ?? item.product_img_url ?? '',
    b2c_price: typeof item.b2c_price === 'number' ? item.b2c_price : (item.b2c_price ?? item.b2cPrice ?? item.price ?? 0),
    b2b_price: typeof item.b2b_price === 'number' ? item.b2b_price : (item.b2b_price ?? item.b2bPrice ?? item.sale_price ?? 0),
    avg_rating_star: item.avg_rating_star ?? item.avgRating ?? 0,
    rating_count: item.rating_count ?? item.review_count ?? 0,
    introduction: item.introduction ?? '',
    product_category: item.product_category ?? item.product_category ?? {},
    similarity: item.similarity ?? item.score ?? item.sim ?? 0,
  } as Product;
}

export function getCountryByIndex(idx: number): string | undefined {
  const countries = ['한국', '일본', '중국', '베트남', '태국', '필리핀', '싱가포르'];
  if (!Number.isFinite(idx)) return undefined;
  const i = Math.floor(idx);
  return countries[i];
}

export default function RecommendProduct() {
  const navigation = useNavigation();
  const params = Route.useParams?.() ?? ({} as any);

  // incoming overrideCityList (legacy) or region param (new)
  const overrideCityList = params?.cityList ?? null;
  const incomingRegionParam = params?.region ?? null; // could be string or array

  const cameFromSave = Boolean(params?.fromSave);

  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [page] = useState<number>(1);
  const [limit] = useState<number>(5);

  const recommendStoreGet = useCallback(() => (useRecommendStore as any).getState(), []);
  const setRecommendBody = useRecommendStore((s: any) => s.setRecommendBody);

  const { country, tendency, region } = useAppSelector(
    (state) => state.travelSlice,
  );

  // regionCheck getter (reads latest from zustand timetableStore)
  const getRegionCheck = useCallback(() => {
    try {
      return (useRegionCheckStore as any).getState()?.regionCheck ?? [];
    } catch {
      return useRegionCheckStore((s) => s.regionCheck);
    }
  }, []);

  const prepareLocalRecommendBody = useCallback((overrideCountryName?: string) => {
    const store = recommendStoreGet();
    const storedBody = store?.recommendBody ?? {
      cityList: [],
      country: '',
      pathList: [[]],
      selectList: tendency,
      topK: 10,
    };
    const body = { ...storedBody };
    return body;
  }, [recommendStoreGet, tendency]);

  // country defs to map en/ko inputs -> Korean country string required by API
  const countryDefs = [
    { ko: '한국', en: 'Korea', alt: ['korea', 'southkorea', '대한민국'] },
    { ko: '일본', en: 'Japan', alt: ['japan'] },
    { ko: '중국', en: 'China', alt: ['china'] },
    { ko: '베트남', en: 'Vietnam', alt: ['vietnam'] },
    { ko: '태국', en: 'Thailand', alt: ['thailand'] },
    { ko: '필리핀', en: 'Philippines', alt: ['philippines'] },
    { ko: '싱가포르', en: 'Singapore', alt: ['singapore'] },
    // hong kong / macau map to single ko string "홍콩과 마카오"
    { ko: '홍콩과 마카오', en: 'HongKongMacao', alt: ['hongkong', 'hong kong', 'macao', 'macau', '마카오', '홍콩'] },
  ];

  // normalize helper for matching
  const normalizeKey = (s?: string) => (s ?? '').toString().replace(/\s+/g, '').toLowerCase();

  // map input token (en or ko or variants) -> Korean country string if found
  const mapTokenToKoreanCountry = (token?: string) => {
    if (!token) return '';
    const key = normalizeKey(token);
    for (const def of countryDefs) {
      if (normalizeKey(def.ko) === key) return def.ko;
      if (normalizeKey(def.en) === key) return def.ko;
      if (def.alt && def.alt.some((a) => normalizeKey(a) === key)) return def.ko;
    }
    return '';
  };

  // helper: parse region param into { countryStr, cityList }
  const parseRegionParam = useCallback((regionParam: any) => {
    // returns { countryStr: string, cityList: string[] }
    if (!regionParam) return { countryStr: '', cityList: [] };

    const items = Array.isArray(regionParam) ? regionParam : [String(regionParam)];
    const derivedCityList: string[] = [];
    let derivedCountryStr = '';

    for (const raw of items) {
      if (!raw || typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/').map(p => p.trim()).filter(Boolean);
        // Expect patterns like ['해외','중간','도시', ...]
        // Use middle part as country token when available
        if (parts.length >= 2) {
          const middle = parts[1];
          const last = parts[parts.length - 1];
          const mapped = mapTokenToKoreanCountry(middle);
          if (mapped) {
            derivedCountryStr = mapped;
          } else {
            // If middle token not recognized, still set it as-is (but user requested Korean names)
            // so we try to fallback: if middle is '홍콩'/'마카오' handled by mapTokenToKoreanCountry,
            // otherwise we keep empty so API may decide or existing country state used.
            derivedCountryStr = middle || derivedCountryStr;
          }
          derivedCityList.push(last);
        } else {
          // can't parse, treat whole trimmed as city
          derivedCityList.push(trimmed);
        }
      } else {
        // No slash -> domestic (한국)
        if (!derivedCountryStr) derivedCountryStr = '한국';
        derivedCityList.push(trimmed);
      }
    }

    // If multiple items produce multiple country candidates, prefer the first valid mapped ko country.
    // derivedCountryStr already set by first mapped middle token.
    return { countryStr: derivedCountryStr, cityList: derivedCityList };
  }, []);

  const fetchProducts = useCallback(async (overrideCountryName?: string) => {
    setLoading(true);
    setError(null);
    try {
      let recentRaw: any = null;
      try {
        recentRaw = await getRecentSelectList();
        console.log('[RecommendProduct] getRecentSelectList ->', recentRaw);
      } catch (e) {
        console.warn('[RecommendProduct] getRecentSelectList failed ->', e);
        recentRaw = null;
      }

      const localBody: any = prepareLocalRecommendBody(overrideCountryName);
      // default fill from travelSlice
      localBody.country = getCountryByIndex(country) ?? localBody.country ?? '';
      localBody.cityList = region ?? localBody.cityList ?? [];
      localBody.pathList = params?.timetable ?? [[]];

      // If route param 'region' provided, parse it and override country/cityList accordingly
      if (incomingRegionParam) {
        const parsed = parseRegionParam(incomingRegionParam);
        if (parsed.countryStr) {
          localBody.country = parsed.countryStr; // Korean name ensured by parseRegionParam
        }
        if (Array.isArray(parsed.cityList) && parsed.cityList.length > 0) {
          localBody.cityList = parsed.cityList;
          console.log('[RecommendProduct] override cityList from parsed region param ->', parsed.cityList);
        }
      } else if (overrideCityList) {
        // legacy override (explicit cityList param)
        localBody.cityList = overrideCityList;
        console.log('[RecommendProduct] override cityList from route params ->', overrideCityList);
      }

      const recent2D = extract2DArray(recentRaw);
      if (recent2D && (!localBody.selectList || localBody.selectList.length === 0)) {
        localBody.selectList = recent2D;
        console.log('[RecommendProduct] Overrode selectList with recent2D ->', recent2D);
      }

      // If cityList still empty, try to use regionCheck from zustand
      if ((!Array.isArray(localBody.cityList) || localBody.cityList.length === 0)) {
        const rc = getRegionCheck();
        if (Array.isArray(rc) && rc.length > 0) {
          localBody.cityList = rc;
          console.log('[RecommendProduct] Replaced empty cityList with regionCheck from store ->', rc);
        } else {
          localBody.cityList = [];
          console.log('[RecommendProduct] cityList empty and regionCheck empty — using []');
        }
      }

      // Build list-mode body (new API schema) with limit = 5
      const postBody: any = {
        pathList: localBody.pathList ?? [[]],
        country: localBody.country ?? "",
        cityList: localBody.cityList ?? [],
        selectList: localBody.selectList ?? [[]],
        mode: "list",
        page,
        limit,
        keyword: "", // could expose as state if needed
      };

      // Log final body before sending
      try {
        console.log('[RecommendProduct] final POST body (object):', postBody);
        console.log('[RecommendProduct] final POST body (json):', JSON.stringify(postBody, null, 2));
      } catch (logErr) {
        console.warn('[RecommendProduct] failed to console.log final postBody', logErr);
      }

      try { setRecommendBody(localBody); } catch (e) { console.warn('[RecommendProduct] setRecommendBody failed', e); }

      try { console.log('[RecommendProduct] axiosAuth.defaults.baseURL ->', axiosAuth.defaults?.baseURL); } catch (e) {}
      const url = RECOMMEND_API_URL || 'sellingProduct/recommend';
      console.log('[RecommendProduct] final POST url ->', url);

      let res;
      try {
        res = await axiosAuth.post(url, postBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        });
      } catch (err: any) {
        console.warn('[RecommendProduct] POST error (axios):', err && err.message ? err.message : err);
        if (err.response) {
          console.warn('[RecommendProduct] POST error response.status:', err.response.status);
          try { console.warn('[RecommendProduct] POST error response.data:', JSON.stringify(err.response.data, null, 2)); } catch (e) { console.warn(err.response.data); }
        }
        throw err;
      }

      try { console.log('[RecommendProduct] response.status ->', res.status); } catch (e) {}
      try { console.log('[RecommendProduct] response.headers ->', res.headers); } catch (e) {}
      try { console.log('[RecommendProduct] response.data (json) ->', JSON.stringify(res.data, null, 2)); } catch (e) { console.log('[RecommendProduct] response.data ->', res.data); }

      const resp = res.data ?? {};
      const rawProds = Array.isArray(resp.products) ? resp.products : extractProductsFromResponse(resp);
      console.log('[RecommendProduct] extracted rawProds count ->', rawProds?.length ?? 0);

      if (!rawProds || rawProds.length === 0) {
        setProductList([]);
        setError('상품을 불러오는데 실패했습니다.');
        return;
      }

      const mapped = rawProds.map((p: any, i: number) => mapRecommendItemToProduct(p, i));
      setProductList(mapped.filter(Boolean).slice(0, 5));
      console.log('[RecommendProduct] mapped length ->', mapped.length);
    } catch (e: any) {
      console.warn('[RecommendProduct] fetchProducts error (outer):', e && e.message ? e.message : e);
      setProductList([]);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [prepareLocalRecommendBody, setRecommendBody, country, region, page, limit, overrideCityList, getRegionCheck, incomingRegionParam, params, parseRegionParam]);

  useEffect(() => {
    fetchProducts().catch(() => {});
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, [fetchProducts]);

  const renderItem = useCallback(({ item }: { item: Product }) => {
    if (!item) return null;
    return (
      <ProductCardLarge
        product={item}
        onPress={() => navigation.navigate('/product/good-product', { product: item })}
      />
    );
  }, [navigation]);

  if (loading && productList.length === 0 && !refreshing) {
    return (
      <AnimateSkeleton delay={400} withGradient withShimmer>
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            height={110}
            width={Dimensions.get('window').width - 32}
            style={{ marginTop: i > 0 ? 24 : 0, alignSelf: 'center', borderRadius: 16 }}
          />
        ))}
      </AnimateSkeleton>
    );
  }

  if (error && productList.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text typography="t4" color={colors.red400} style={{ marginBottom: 14 }}>
          {error}
        </Text>
        <Button onPress={() => fetchProducts()}>다시 시도</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FixedBottomCTAProvider>
        <Top
          title={
            <Text typography="t6" fontWeight="medium" color={colors.grey600}>
              일정과 어울리는 여행 상품을 추천합니다
            </Text>
          }
          subtitle1={
            <Text typography="t3" fontWeight="bold" color={colors.grey900}>
              이런 상품 어떠세요?
            </Text>
          }
        />
        <View style={{ flex: 1 }}>
          <FlatList
            data={productList.filter((item, idx, arr) => arr.findIndex((v) => v.prod_no === item.prod_no) === idx)}
            keyExtractor={(item) => String(item.prod_no)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            initialNumToRender={5}
            windowSize={11}
            removeClippedSubviews={false}
            ListEmptyComponent={!loading ? (
              <View style={{ padding: 24 }}>
                <Text typography="t5" color={colors.grey600}>검색 결과가 없습니다.</Text>
              </View>
            ) : null}
          />
        </View>

        {cameFromSave ? (
          <FixedBottomCTA
            onPress={() => {
              navigation.reset({
                index: 1, // active route will be routes[1]
                routes: [
                  { name: `/${import.meta.env.APP_START_MODE}` },
                  { name: '/my-travle-list' },
                ],
              });
            }}
          >
            {'건너뛰기'}
          </FixedBottomCTA>
        ) : (
          <FixedBottomCTA
            onPress={() => {
              navigation.goBack();
            }}
          >
            {'뒤로 가기'}
          </FixedBottomCTA>
        )}
      </FixedBottomCTAProvider>
    </View>
  );
}