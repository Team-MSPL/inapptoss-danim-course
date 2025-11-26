import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@granite-js/react-native";
import {
  colors,
  Text,
  Icon,
  Button,
  Skeleton,
  AnimateSkeleton,
  FixedBottomCTAProvider,
} from "@toss-design-system/react-native";
import ProductCard, { Product } from "../../components/main/product-card";
import { StepText } from "../../components/step-text";
import axiosAuth from "../../redux/api";
import { getRecentSelectList } from "../../zustand/api";
import CountrySelector from "../../components/main/CountrySelector";
import { useRecommendStore } from "../../zustand/recommendStore";

const RECOMMEND_API_URL = `${import.meta.env.API_ROUTE_RELEASE}/sellingProduct/recommend`;

type Country = { code: string; dial: string; label: string; lang: string };

type Props = {
  initialCountry?: string | null;
};

const COUNTRY_OPTIONS: Country[] = [
  { code: "KR", dial: "82", label: "한국", lang: "ko" },
  { code: "JP", dial: "81", label: "일본", lang: "ja" },
  { code: "CN", dial: "86", label: "중국", lang: "zh-cn" },
  { code: "VN", dial: "84", label: "베트남", lang: "vi" },
  { code: "TH", dial: "66", label: "태국", lang: "th" },
  { code: "PH", dial: "63", label: "필리핀", lang: "en" },
  { code: "SG", dial: "65", label: "싱가포르", lang: "en" },
];

const COUNTRY_NAME_MAP: Record<string, string> = {
  KR: "한국",
  JP: "일본",
  CN: "중국",
  VN: "베트남",
  TH: "태국",
  PH: "필리핀",
  SG: "싱가포르",
};

/* -------------------------
   Helpers (unchanged)
   ------------------------- */

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
  if (typeof maybe === "object") {
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

function extractProductArrayFromResponseData(data: any): any[] | null {
  if (!data) return null;

  // prefer standardized 'products' field if present (list mode)
  if (Array.isArray(data.products)) return data.products;

  if (data.prods && Array.isArray(data.prods)) return data.prods;
  if (Array.isArray(data)) {
    // nested arrays case e.g. [ [ {...}, {...} ] ]
    if (data.length > 0 && Array.isArray(data[0])) {
      const flat = (data as any).flat ? (data as any).flat(Infinity) : flattenArray(data);
      return flat.filter((it: any) => it && typeof it === "object" && !Array.isArray(it));
    }
    // simple array of objects
    return data;
  }
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.data)) return data.data;

  if (typeof data === "object") {
    for (const v of Object.values(data)) {
      if (Array.isArray(v)) {
        if (v.length > 0 && Array.isArray(v[0])) {
          const flat = (v as any).flat ? (v as any).flat(Infinity) : flattenArray(v);
          return flat.filter((it: any) => it && typeof it === "object" && !Array.isArray(it));
        }
        if (v.length === 0 || typeof v[0] === "object") return v as any[];
      }
    }
  }
  return null;
}

function mapRecommendItemToProduct(item: any, idx: number): Product {
  return {
    prod_no: item.prod_no ?? item._id ?? item.prodNo ?? `idx_${idx}`,
    prod_name: item.prod_name ?? item.prodName ?? item.name ?? "",
    prod_img_url: item.prod_img_url ?? item.prod_img ?? item.prodImg ?? item.prod_img_url ?? "",
    b2c_price: typeof item.b2c_price === "number" ? item.b2c_price : (item.b2c_price ?? item.b2cPrice ?? item.price ?? 0),
    b2b_price: typeof item.b2b_price === "number" ? item.b2b_price : (item.b2b_price ?? item.b2bPrice ?? item.sale_price ?? 0),
    avg_rating_star: item.avg_rating_star ?? item.avgRating ?? 0,
    rating_count: item.rating_count ?? item.review_count ?? item.sellingProductReviewCount ?? 0,
    introduction: item.introduction ?? (Array.isArray(item.productPlaces) ? item.productPlaces[1] ?? "" : ""),
    product_category: item.product_category ?? item.product_category ?? {},
  } as Product;
}

/* -------------------------
   Component
   ------------------------- */

export default function MainTravelShop({ initialCountry = null }: Props) {
  const navigation = useNavigation();

  const [productList, setProductList] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If initialCountry is provided, we start with that selected and hide the picker.
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry ?? null);
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(!initialCountry);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // pagination & mode
  const [mode] = useState<"recommend" | "list">("list"); // fixed to 'list'
  const [keyword, setKeyword] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const totalCountRef = useRef(0);

  // debug state to inspect raw response on screen (optional)
  const [debugResponse, setDebugResponse] = useState<any | null>(null);

  // read recommend body from zustand without subscribing to avoid re-renders
  const recommendStoreGet = useCallback(() => useRecommendStore.getState(), []);

  const prepareLocalRecommendBody = useCallback(
    (countryCode?: string) => {
      const store = recommendStoreGet();
      const storedBody = store?.recommendBody ?? {
        cityList: [],
        country: "",
        pathList: [[]],
        selectList: [[]],
        topK: 10,
      };
      const countryName = countryCode ? COUNTRY_NAME_MAP[countryCode] ?? "" : storedBody.country ?? "";
      // copy
      return { ...storedBody, country: countryName };
    },
    [recommendStoreGet]
  );

  // fetchProducts: fetches products in 'list' mode and supports page-based append
  const fetchProducts = useCallback(
    async (opts?: {
      overrideCountryCode?: string;
      optPage?: number;
      optLimit?: number;
      optKeyword?: string;
      append?: boolean;
    }) => {
      const {
        overrideCountryCode,
        optPage = 1,
        optLimit = limit,
        optKeyword = keyword,
        append = false,
      } = opts ?? {};

      const countryToUse = overrideCountryCode ?? selectedCountry;
      if (!countryToUse) return; // nothing to fetch

      if (append && loadingMore) return;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);

        // 1) obtain recent select list first
        const recentRaw = await getRecentSelectList();
        console.debug("[MainTravelShop] recentRaw from getRecentSelectList():", recentRaw);

        // 2) prepare local recommend body
        const localBody = prepareLocalRecommendBody(countryToUse);

        // 3) override selectList if we can extract a 2D array
        const recent2D = extract2DArray(recentRaw);
        if (recent2D) {
          localBody.selectList = recent2D;
          console.debug("[MainTravelShop] Overrode selectList with recent2D:", recent2D);
        } else {
          console.debug("[MainTravelShop] No 2D selectList found in recentRaw; keeping stored selectList");
        }

        const finalPage = Math.max(1, Number(optPage ?? 1));
        const finalLimit = Math.max(1, Number(optLimit ?? 20));

        // build request body for 'list' mode
        const postBody: any = {
          pathList: localBody.pathList ?? [[]],
          country: localBody.country ?? "",
          cityList: localBody.cityList ?? [],
          selectList: localBody.selectList ?? [[]],
          mode: "list",
          page: finalPage,
          limit: finalLimit,
          keyword: optKeyword ?? "",
        };

        console.debug("[MainTravelShop] FINAL POST body (about to send):", JSON.stringify(postBody, null, 2));

        const response = await axiosAuth.post(RECOMMEND_API_URL, postBody, {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        });

        try {
          console.debug("[MainTravelShop] recommend response.status:", response.status);
          setDebugResponse(response.data);
        } catch (logErr) {
          console.debug("[MainTravelShop] error logging response:", logErr);
        }

        // Expect response.data.products, response.data.totalCount, response.data.totalPage
        const resp = response.data ?? {};
        const rawProds = Array.isArray(resp.products) ? resp.products : extractProductArrayFromResponseData(resp);
        const respTotalCount = typeof resp.totalCount === "number" ? resp.totalCount : undefined;
        const respTotalPage = typeof resp.totalPage === "number" ? resp.totalPage : undefined;

        if (!rawProds) {
          console.debug("[MainTravelShop] No product array found in response.data:", response.data);
          if (!append) {
            setProductList([]);
            setTotal(0);
          }
          setError("상품을 불러오는데 실패했습니다.");
          setHasMore(false);
        } else {
          const mapped: Product[] = rawProds.map((p: any, i: number) => mapRecommendItemToProduct(p, i));
          if (append) {
            const existingIds = new Set(productList.map((p) => String(p.prod_no)));
            const uniques = mapped.filter((m) => !existingIds.has(String(m.prod_no)));
            const newList = [...productList, ...uniques];
            setProductList(newList);
            const newTotal = respTotalCount ?? newList.length;
            setTotal(newTotal);
            totalCountRef.current = newList.length;

            // determine pagination state
            const tp = respTotalPage ?? Math.max(1, Math.ceil((respTotalCount ?? newList.length) / finalLimit));
            setTotalPage(tp);
            // if finalPage >= totalPage then no more
            if (finalPage >= tp || uniques.length === 0 || mapped.length < finalLimit) {
              setHasMore(false);
            } else {
              setHasMore(true);
            }
          } else {
            // replace
            setProductList(mapped.filter(Boolean));
            const newTotal = respTotalCount ?? mapped.length;
            setTotal(newTotal);
            totalCountRef.current = mapped.length;

            const tp = respTotalPage ?? Math.max(1, Math.ceil((respTotalCount ?? mapped.length) / finalLimit));
            setTotalPage(tp);
            // if only one page or returned less than limit -> no more
            if (finalPage >= tp || mapped.length < finalLimit) setHasMore(false);
            else setHasMore(true);
            // ensure page state matches server
            setPage(finalPage);
          }
        }
      } catch (e: any) {
        console.warn("[MainTravelShop] recommend fetch error:", e);
        if (!append) {
          setProductList([]);
          setTotal(0);
        }
        setError("상품을 불러오는데 실패했습니다.");
        setHasMore(false);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [prepareLocalRecommendBody, selectedCountry, limit, keyword, productList, loadingMore]
  );

  // If initialCountry prop changes later, update selection
  useEffect(() => {
    setSelectedCountry(initialCountry ?? null);
    setShowCountryPicker(!initialCountry);
  }, [initialCountry]);

  // Load products when selectedCountry changes (initial load and when user selects a country)
  useEffect(() => {
    if (selectedCountry) {
      setPage(1);
      setHasMore(true);
      fetchProducts({ optPage: 1, optLimit: limit, optKeyword: keyword, append: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, limit, keyword]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchProducts({ optPage: 1, optLimit: limit, optKeyword: keyword, append: false }).finally(() => setRefreshing(false));
  }, [fetchProducts, limit, keyword]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts({ optPage: nextPage, optLimit: limit, optKeyword: keyword, append: true });
  }, [fetchProducts, page, limit, keyword, hasMore, loadingMore]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      if (!item) return null;
      return (
        <ProductCard
          product={item}
          onPress={() => {
            navigation.navigate("/product/good-product", { product: item });
          }}
        />
      );
    },
    [navigation]
  );

  const renderHeader = useCallback(
    () => (
      <View style={{ backgroundColor: "#fff" }}>
        <StepText
          title={"나그네님을 위한 맞춤 여행 상품"}
          subTitle1={"상품 추천"}
          subTitle2={"나만의 여정에 어울리는 상품을 추천해드립니다."}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.red50, borderRadius: 18, alignItems: "center", flexDirection: "row", padding: 10, width: 232, marginBottom: 14 }}>
            <Icon name="icon-shopping-bag-red" color={colors.red300} size={22} style={{ marginHorizontal: 6 }} />
            <Text typography="t6" color={colors.red400} fontWeight="medium">최저가로 즐기는 특별한 여행!</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text typography="t7" color={colors.grey700}>총 {total}개</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* If a country is selected show a change-country link */}
              {selectedCountry && (
                <TouchableOpacity onPress={() => {
                  setShowCountryPicker(true);
                  setSelectedCountry(null);
                }}>
                  <Text typography="t7" color={colors.grey600}>다른 나라 선택</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    ),
    [total, selectedCountry]
  );

  const isNoProduct = !loading && Array.isArray(productList) && productList.length === 0;

  if (!selectedCountry && showCountryPicker) {
    // show country picker screen
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 8 }}>
        <FixedBottomCTAProvider>
          <StepText title={'여행상품을 찾으시나요?'} subTitle1={'원하는 국가를 선택해주세요!'} />
          <CountrySelector
            countries={COUNTRY_OPTIONS}
            selectedCode={undefined}
            onSelect={(code) => {
              // set selection and allow effect to trigger data load
              setSelectedCountry(code);
              setShowCountryPicker(false);
            }}
            columns={2}
          />
        </FixedBottomCTAProvider>
      </View>
    );
  }

  if (loading && productList.length === 0 && !refreshing) {
    return (
      <AnimateSkeleton delay={400} withGradient withShimmer>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={110} width={Dimensions.get("window").width - 32} style={{ marginTop: i > 0 ? 24 : 0, alignSelf: "center", borderRadius: 16 }} />
        ))}
      </AnimateSkeleton>
    );
  }

  if (error && !isNoProduct) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text typography="t4" color={colors.red400} style={{ marginBottom: 14 }}>
          {typeof error === "string" ? error : "상품을 불러오는데 실패했습니다."}
        </Text>
        <Button onPress={() => {
          setPage(1);
          setHasMore(true);
          fetchProducts({ optPage: 1, optLimit: limit, optKeyword: keyword, append: false });
        }}>다시 시도</Button>
      </View>
    );
  }

  // Footer: loading indicator / centered plain-text "더 불러오기" / no-more message
  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View style={{ padding: 16, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>상품을 불러오는 중입니다...</Text>
        </View>
      );
    }
    if (hasMore) {
      return (
        <View style={{ paddingVertical: 18, alignItems: "center", justifyContent: "center" }}>
          <TouchableOpacity onPress={loadMore} activeOpacity={0.7} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text typography="t5" color={colors.grey600} >
              상품 더 불러오기
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    // no more
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text typography="t7" color={colors.grey400}>더 불러올 상품이 없습니다.</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={productList.filter((item, idx, arr) => arr.findIndex((v) => v.prod_no === item.prod_no) === idx)}
        keyExtractor={(item) => String(item.prod_no)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        initialNumToRender={15}
        windowSize={11}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </View>
  );
}