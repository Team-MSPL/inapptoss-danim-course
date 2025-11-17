import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Dimensions, Platform, ScrollView } from 'react-native';
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
import { getRecentSelectList} from "../zustand/api";
import ProductCardLarge, { Product } from "../components/main/product-card-large";
import useRecommendStore from "../zustand/recommendStore";
import {useAppSelector} from "../src/store";

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

export function getCountryByIndex(idx: number): string | undefined {
  const countries = ['한국', '일본', '중국', '베트남', '태국', '필리핀', '싱가포르'];
  if (!Number.isFinite(idx)) return undefined;
  const i = Math.floor(idx);
  return countries[i];
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

/* Component */
export default function RecommendProduct() {
  const navigation = useNavigation();

  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [debugResponse, setDebugResponse] = useState<any | null>(null);

  const recommendStoreGet = useCallback(() => (useRecommendStore as any).getState(), []);
  const setRecommendBody = useRecommendStore((s: any) => s.setRecommendBody);

  const { country, tendency, region } = useAppSelector(
    (state) => state.travelSlice,
  );

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
  }, [recommendStoreGet]);

  const fetchProducts = useCallback(async (overrideCountryName?: string) => {
    setLoading(true);
    setError(null);
    setDebugResponse(null);
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
      console.log('[RecommendProduct] initial localBody ->', localBody);
      try { console.log('[RecommendProduct] initial localBody JSON ->', JSON.stringify(localBody, null, 2)); } catch (e) {}

      const recent2D = extract2DArray(recentRaw);
      if (recent2D) {
        if(localBody.selectList.length <= 0) {
          localBody.selectList = recent2D;
        }
        else {
          localBody.selectList = tendency;
        }
        console.log(getCountryByIndex(country));
        localBody.country = getCountryByIndex(country);
        localBody.cityList = region;
        console.log('[RecommendProduct] Overrode selectList with recent2D ->', recent2D);
      } else {
        console.log('[RecommendProduct] No 2D selectList found in recentRaw; using stored selectList');
      }

      try { setRecommendBody(localBody); } catch (e) { console.warn('[RecommendProduct] setRecommendBody failed', e); }

      try { console.log('[RecommendProduct] axiosAuth.defaults.baseURL ->', axiosAuth.defaults?.baseURL); } catch (e) {}
      const url = RECOMMEND_API_URL || 'sellingProduct/recommend';
      console.log('[RecommendProduct] final POST url ->', url);

      let res;
      try {
        res = await axiosAuth.post(url, localBody, {
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

      setDebugResponse(res.data);

      const rawProds = extractProductsFromResponse(res.data);
      console.log('[RecommendProduct] extracted rawProds count ->', rawProds?.length ?? 0);
      try { console.log('[RecommendProduct] extracted sample ->', JSON.stringify((rawProds ?? []).slice(0,3), null, 2)); } catch (e) {}

      if (!rawProds || rawProds.length === 0) {
        setProductList([]);
        setError('상품을 불러오는데 실패했습니다.');
        return;
      }

      const mapped = rawProds.map((p: any, i: number) => mapRecommendItemToProduct(p, i));
      setProductList(mapped.filter(Boolean));
      console.log('[RecommendProduct] mapped length ->', mapped.length);
    } catch (e: any) {
      console.warn('[RecommendProduct] fetchProducts error (outer):', e && e.message ? e.message : e);
      setProductList([]);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [prepareLocalRecommendBody, setRecommendBody]);

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
            initialNumToRender={10}
            scrollEnabled={false}
            windowSize={11}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={!loading ? (
              <View style={{ padding: 24 }}>
                <Text typography="t5" color={colors.grey600}>검색 결과가 없습니다.</Text>
              </View>
            ) : null}
          />
        </View>

        <FixedBottomCTA
          onPress={() => {
            fetchProducts().finally(() => {
              navigation.reset({ index: 0, routes: [{ name: '/my-travle-list' }] });
            });
          }}
        >
          {'건너뛰기'}
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}