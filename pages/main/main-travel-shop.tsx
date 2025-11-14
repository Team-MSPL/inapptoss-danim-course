import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  Dimensions,
  Platform,
  ScrollView,
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

const COUNTRY_OPTIONS: Country[] = [
  { code: "KR", dial: "82", label: "한국", lang: "ko" },
  { code: "JP", dial: "81", label: "일본", lang: "ja" },
  { code: "US", dial: "1", label: "미국", lang: "en" },
  { code: "VN", dial: "84", label: "베트남", lang: "vi" },
  { code: "TW", dial: "886", label: "대만", lang: "zh-tw" },
  { code: "CN", dial: "86", label: "중국", lang: "zh-cn" },
  { code: "TH", dial: "66", label: "태국", lang: "th" },
  { code: "HK", dial: "852", label: "홍콩", lang: "zh-hk" },
];

const COUNTRY_NAME_MAP: Record<string, string> = {
  KR: "한국",
  JP: "일본",
  US: "미국",
  VN: "베트남",
  TW: "대만",
  CN: "중국",
  TH: "태국",
  HK: "홍콩",
};

/* -------------------------
   Helpers
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

export default function MainTravelShop() {
  const navigation = useNavigation();

  const [productList, setProductList] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string>("KR");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // removed client-side pagination state: we will render all returned items
  const totalCountRef = useRef(0);
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(true);

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

  // fetchProducts: fetches and sets the ENTIRE product list returned by recommend API
  const fetchProducts = useCallback(
    async (overrideCountryCode?: string) => {
      setLoading(true);
      setError(null);

      try {
        // 1) obtain recent select list first
        const recentRaw = await getRecentSelectList();
        console.debug("[MainTravelShop] recentRaw from getRecentSelectList():", recentRaw);

        // 2) prepare local recommend body
        const localBody = prepareLocalRecommendBody(overrideCountryCode ?? selectedCountry);

        // 3) override selectList if we can extract a 2D array
        const recent2D = extract2DArray(recentRaw);
        if (recent2D) {
          localBody.selectList = recent2D;
          console.debug("[MainTravelShop] Overrode selectList with recent2D:", recent2D);
        } else {
          console.debug("[MainTravelShop] No 2D selectList found in recentRaw; keeping stored selectList");
        }

        // 4) send final body exactly as-is (do not inject start/filters)
        console.debug("[MainTravelShop] FINAL POST recommend body (about to send):", JSON.stringify(localBody, null, 2));

        const response = await axiosAuth.post(RECOMMEND_API_URL, localBody, {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        });

        // debug logs and store raw response so you can inspect in UI
        try {
          console.debug("[MainTravelShop] recommend response.status:", response.status);
          console.debug("[MainTravelShop] recommend response.data (stringified):", JSON.stringify(response.data, null, 2));
          setDebugResponse(response.data);
        } catch (logErr) {
          console.debug("[MainTravelShop] error logging response:", logErr);
        }

        // 5) robust extraction of product array and mapping
        const rawProds = extractProductArrayFromResponseData(response.data);
        if (!rawProds) {
          console.debug("[MainTravelShop] No product array found in response.data:", response.data);
          setProductList([]);
          setTotal(0);
          setError("상품을 불러오는데 실패했습니다.");
        } else {
          // IMPORTANT: set the full list as-is (no client-side slicing)
          const mapped: Product[] = rawProds.map((p: any, i: number) => mapRecommendItemToProduct(p, i));
          setProductList(mapped.filter(Boolean));
          setTotal(mapped.length);
          totalCountRef.current = mapped.length;
        }
      } catch (e: any) {
        setProductList([]);
        setTotal(0);
        setError("상품을 불러오는데 실패했습니다.");
        console.warn("[MainTravelShop] recommend fetch error:", e);
      } finally {
        setLoading(false);
      }
    },
    [prepareLocalRecommendBody, selectedCountry]
  );

  useEffect(() => {
    if (!showCountryPicker) {
      // initial load after user picks country
      fetchProducts(selectedCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCountryPicker]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(selectedCountry).finally(() => setRefreshing(false));
  }, [fetchProducts, selectedCountry]);

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
          subTitle2={"내 여정과 어울리는 여행 상품을 추천해드려요"}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.red50, borderRadius: 18, alignItems: "center", flexDirection: "row", padding: 10, width: 232, marginBottom: 14 }}>
            <Icon name="icon-shopping-bag-red" color={colors.red300} size={22} style={{ marginHorizontal: 6 }} />
            <Text typography="t6" color={colors.red400} fontWeight="medium">최저가로 즐기는 특별한 여행!</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text typography="t7" color={colors.grey700}>총 {total}개</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }} />
          </View>
        </View>
      </View>
    ),
    [total, debugResponse]
  );

  const isNoProduct = !loading && Array.isArray(productList) && productList.length === 0;

  if (loading && productList.length === 0 && !refreshing) {
    return (
      <AnimateSkeleton delay={400} withGradient withShimmer>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={110} width={Dimensions.get("window").width - 32} style={{ marginTop: i > 0 ? 24 : 0, alignSelf: "center", borderRadius: 16 }} />
        ))}
      </AnimateSkeleton>
    );
  }

  if (showCountryPicker) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 8 }}>
        <FixedBottomCTAProvider>
          <StepText title={'여행상품을 찾으시나요?'} subTitle1={'원하는 국가를 선택해주세요!'} />
          <CountrySelector
            countries={COUNTRY_OPTIONS}
            onSelect={(code) => {
              setSelectedCountry(code);
              setShowCountryPicker(false);
              // fetchProducts will be triggered by useEffect when showCountryPicker changes,
              // but call explicitly to start faster
              fetchProducts(code);
            }}
          />
        </FixedBottomCTAProvider>
      </View>
    );
  }

  if (error && !isNoProduct) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text typography="t4" color={colors.red400} style={{ marginBottom: 14 }}>
          {typeof error === "string" ? error : "상품을 불러오는데 실패했습니다."}
        </Text>
        <Button onPress={() => fetchProducts(selectedCountry)}>다시 시도</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Show all returned products in a FlatList (no 'load more' footer). API may return 5~15 items; we'll render whatever comes back. */}
      <FlatList
        data={productList.filter((item, idx, arr) => arr.findIndex((v) => v.prod_no === item.prod_no) === idx)}
        keyExtractor={(item) => String(item.prod_no)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
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