import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
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

  if (Array.isArray(data.products)) return data.products;

  if (data.prods && Array.isArray(data.prods)) return data.prods;
  if (Array.isArray(data)) {
    if (data.length > 0 && Array.isArray(data[0])) {
      const flat = (data as any).flat ? (data as any).flat(Infinity) : flattenArray(data);
      return flat.filter((it: any) => it && typeof it === "object" && !Array.isArray(it));
    }
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
    b2b_price: typeof item.b2b_price === "number" ? item.b2b_price : (item.b2c_price ?? item.b2bPrice ?? item.sale_price ?? 0),
    avg_rating_star: item.avg_rating_star ?? item.avgRating ?? 0,
    rating_count: item.rating_count ?? item.review_count ?? item.sellingProductReviewCount ?? 0,
    introduction: item.introduction ?? (Array.isArray(item.productPlaces) ? item.productPlaces[1] ?? "" : ""),
    product_category: item.product_category ?? item.product_category ?? {},
  } as Product;
}

export default function MainTravelShop({ initialCountry = null }: Props) {
  const navigation = useNavigation();

  const [productList, setProductList] = useState<Product[]>([]);
  const productListRef = useRef<Product[]>([]);
  useEffect(() => {
    productListRef.current = productList;
  }, [productList]);

  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false); // general loading for fetch
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry ?? null);
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(!initialCountry);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [mode] = useState<"recommend" | "list">("list");
  const [keyword, setKeyword] = useState<string>(""); // controlled input
  const [lastSearchedKeyword, setLastSearchedKeyword] = useState<string>(""); // last keyword actually used to call API
  const [isSearching, setIsSearching] = useState<boolean>(false); // searching via keyword button

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const totalCountRef = useRef(0);
  const [debugResponse, setDebugResponse] = useState<any | null>(null);

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
      return { ...storedBody, country: countryName };
    },
    [recommendStoreGet]
  );

  const requestIdRef = useRef(0);

  const fetchProducts = useCallback(
    async (opts?: {
      overrideCountryCode?: string;
      optPage?: number;
      optLimit?: number;
      optKeyword?: string;
      append?: boolean;
      signalRequestId?: number;
    }) => {
      const {
        overrideCountryCode,
        optPage = 1,
        optLimit = limit,
        optKeyword = lastSearchedKeyword ?? "",
        append = false,
        signalRequestId,
      } = opts ?? {};

      const countryToUse = overrideCountryCode ?? selectedCountry;
      if (!countryToUse) return;

      if (append && loadingMore) return;

      const currentRequestId = typeof signalRequestId === "number" ? signalRequestId : ++requestIdRef.current;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);

        const recentRaw = await getRecentSelectList();

        const localBody = prepareLocalRecommendBody(countryToUse);

        const recent2D = extract2DArray(recentRaw);
        if (recent2D) {
          localBody.selectList = recent2D;
        }

        const finalPage = Math.max(1, Number(optPage ?? 1));
        const finalLimit = Math.max(1, Number(optLimit ?? 20));

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

        const response = await axiosAuth.post(RECOMMEND_API_URL, postBody, {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        });

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        try {
          setDebugResponse(response.data);
        } catch (logErr) {
          // ignore
        }

        const resp = response.data ?? {};
        const rawProds = Array.isArray(resp.products) ? resp.products : extractProductArrayFromResponseData(resp);
        const respTotalCount = typeof resp.totalCount === "number" ? resp.totalCount : undefined;
        const respTotalPage = typeof resp.totalPage === "number" ? resp.totalPage : undefined;

        if (!rawProds) {
          if (!append) {
            setProductList([]);
            setTotal(0);
          }
          setError("상품을 불러오는데 실패했습니다.");
          setHasMore(false);
        } else {
          const mapped: Product[] = rawProds.map((p: any, i: number) => mapRecommendItemToProduct(p, i));
          if (append) {
            const existingIds = new Set(productListRef.current.map((p) => String(p.prod_no)));
            const uniques = mapped.filter((m) => !existingIds.has(String(m.prod_no)));
            setProductList((prev) => {
              const newList = [...prev, ...uniques];
              totalCountRef.current = newList.length;
              return newList;
            });
            const newTotal = respTotalCount ?? (productListRef.current.length + mapped.length);
            setTotal(newTotal);

            const tp = respTotalPage ?? Math.max(1, Math.ceil((respTotalCount ?? (productListRef.current.length + mapped.length)) / finalLimit));
            setTotalPage(tp);
            if (finalPage >= tp || uniques.length === 0 || mapped.length < finalLimit) {
              setHasMore(false);
            } else {
              setHasMore(true);
            }
          } else {
            setProductList(mapped.filter(Boolean));
            const newTotal = respTotalCount ?? mapped.length;
            setTotal(newTotal);
            totalCountRef.current = mapped.length;

            const tp = respTotalPage ?? Math.max(1, Math.ceil((respTotalCount ?? mapped.length) / finalLimit));
            setTotalPage(tp);

            if (finalPage >= tp || mapped.length < finalLimit) setHasMore(false);
            else setHasMore(true);

            setPage(finalPage);
          }
        }
      } catch (e: any) {
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
    [prepareLocalRecommendBody, selectedCountry, limit, lastSearchedKeyword, loadingMore]
  );

  useEffect(() => {
    setSelectedCountry(initialCountry ?? null);
    setShowCountryPicker(!initialCountry);
  }, [initialCountry]);

  useEffect(() => {
    if (selectedCountry && lastSearchedKeyword === "") {
      setPage(1);
      setHasMore(true);
      const reqId = ++requestIdRef.current;
      fetchProducts({ optPage: 1, optLimit: limit, optKeyword: "", append: false, signalRequestId: reqId });
    }
  }, [selectedCountry, limit, fetchProducts, lastSearchedKeyword]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    const reqId = ++requestIdRef.current;
    fetchProducts({ optPage: 1, optLimit: limit, optKeyword: lastSearchedKeyword ?? "", append: false, signalRequestId: reqId })
      .finally(() => setRefreshing(false));
  }, [fetchProducts, limit, lastSearchedKeyword]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    const reqId = ++requestIdRef.current;
    fetchProducts({ optPage: nextPage, optLimit: limit, optKeyword: lastSearchedKeyword ?? "", append: true, signalRequestId: reqId });
  }, [fetchProducts, page, limit, lastSearchedKeyword, hasMore, loadingMore]);

  const handleSearch = useCallback(() => {
    if (!selectedCountry) return;
    if (isSearching) return;
    const query = String(keyword ?? "").trim();
    setLastSearchedKeyword(query);
    setIsSearching(true);
    Keyboard.dismiss();
    setPage(1);
    setHasMore(true);
    const reqId = ++requestIdRef.current;
    fetchProducts({ optPage: 1, optLimit: limit, optKeyword: query, append: false, signalRequestId: reqId })
      .finally(() => {
        setIsSearching(false);
      });
  }, [fetchProducts, keyword, limit, selectedCountry, isSearching]);

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

  const isNoProduct = !loading && Array.isArray(productList) && productList.length === 0;

  if (!selectedCountry && showCountryPicker) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 8 }}>
        <FixedBottomCTAProvider>
          <StepText title={'여행상품을 찾으시나요?'} subTitle1={'원하는 국가를 선택해주세요!'} />
          <CountrySelector
            countries={COUNTRY_OPTIONS}
            selectedCode={undefined}
            onSelect={(code) => {
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
          const reqId = ++requestIdRef.current;
          fetchProducts({ optPage: 1, optLimit: limit, optKeyword: lastSearchedKeyword ?? "", append: false, signalRequestId: reqId });
        }}>다시 시도</Button>
      </View>
    );
  }

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
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text typography="t7" color={colors.grey400}>더 불러올 상품이 없습니다.</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: "#fff" }}>
        <StepText
          title={"나그네님을 위한 맞춤 여행 상품"}
          subTitle1={"상품 추천"}
          subTitle2={"선택하신 코스에 꼭 맞는 상품을 모아봤어요."}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.red50, borderRadius: 18, alignItems: "center", flexDirection: "row", padding: 10, width: 232, marginBottom: 14 }}>
            <Icon name="icon-shopping-bag-red" color={colors.red300} size={22} style={{ marginHorizontal: 6 }} />
            <Text typography="t6" color={colors.red400} fontWeight="medium">최저가로 즐기는 특별한 여행!</Text>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              placeholder="상품명 또는 키워드로 검색"
              placeholderTextColor={colors.grey500}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
              style={styles.searchInput}
              clearButtonMode="while-editing"
              autoCorrect={false}
              editable={!isSearching && !loading}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton} disabled={isSearching || loading}>
              {isSearching ? (
                <ActivityIndicator />
              ) : (
                <Icon name="icon-search-mono" size={18} color={colors.grey600} />
              )}
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text typography="t7" color={colors.grey700}>총 {total}개</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {selectedCountry && (
                <TouchableOpacity onPress={() => { setShowCountryPicker(true); setSelectedCountry(null); }}>
                  <Text typography="t7" color={colors.grey600}>다른 나라 선택</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={productList.filter((item, idx, arr) => arr.findIndex((v) => v.prod_no === item.prod_no) === idx)}
        keyExtractor={(item) => String(item.prod_no)}
        renderItem={renderItem}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        initialNumToRender={15}
        windowSize={11}
        removeClippedSubviews={Platform.OS === "android"}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.grey100,
    color: colors.grey700,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grey100,
  },
});