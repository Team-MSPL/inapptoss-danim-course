import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import {
  colors,
  Text,
  Icon,
  Button,
  Skeleton,
  AnimateSkeleton,
  useBottomSheet,
  BottomSheet,
} from '@toss-design-system/react-native';
import ProductCard, { Product } from '../../components/main/product-card';
import { StepText } from '../../components/step-text';
import axiosAuth from "../../redux/api";
import {getRecentSelectList} from "../../zustand/api";

const SORT_OPTIONS = [
  { label: '추천순', value: 'RECOMMEND' },
  { label: '높은 가격순', value: 'PDESC' },
  { label: '낮은 가격순', value: 'PASC' },
  { label: '높은 평점순', value: 'SDESC' }
] as const;

const GUIDE_OPTIONS = [
  { label: '한국어', value: 'ko' },
  { label: '영어', value: 'en' },
] as const;

const PRICE_MIN = 0;
const PRICE_MAX = 100000;

const SEARCH_API_URL = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Search`;

type Country = {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
};

type ProductCategory = {
  main: string;
  sub: string[];
};

type SearchApiResponse = {
  metadata: {
    result: string;
    result_msg: string;
    total_count: number;
    start: number;
    count: number;
  };
  prods: Product[];
};

const PAGE_SIZE = 10;

function getSortApiCode(sortType: string) {
  switch (sortType) {
    case 'RECOMMEND': return 'RECOMMEND';
    case 'PDESC': return 'PDESC';
    case 'PASC': return 'PASC';
    case 'SDESC': return 'SDESC';
    default: return 'RECOMMEND';
  }
}

export default function MainTravelShop() {
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();

  const [productList, setProductList] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [sortType, setSortType] = useState<typeof SORT_OPTIONS[number]['value']>('RECOMMEND');
  const [minPriceInput, setMinPriceInput] = useState<string>(String(PRICE_MIN));
  const [maxPriceInput, setMaxPriceInput] = useState<string>(String(PRICE_MAX));
  const [guideSel, setGuideSel] = useState<string[]>([]); // 멀티 선택

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const totalCountRef = useRef(0);

  const buildSearchBody = () => {
    const body: Record<string, any> = {
      start: page * PAGE_SIZE,
      page_size: PAGE_SIZE,
      sort: getSortApiCode(sortType),
    };
    if (minPriceInput) body.price_from = minPriceInput;
    if (maxPriceInput) body.price_to = maxPriceInput;
    if (guideSel.length > 0) body.guide_langs = guideSel;
    return body;
  };

  const fetchProducts = useCallback(async (reset = false) => {
    const nextPage = reset ? 0 : page;
    if (reset) setLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const recent = await getRecentSelectList();

      if (recent && recent.recentSelectList) {
        //TODO : Recommend로 변경
        const body = buildSearchBody();
        const response = await axiosAuth.post<SearchApiResponse>(SEARCH_API_URL, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });

        if (
          response.status === 200 &&
          response.data &&
          Array.isArray(response.data.prods)
        ) {
          if (reset) {
            setProductList(response.data.prods.filter(Boolean));
          } else {
            setProductList(prev => [...prev, ...response.data.prods.filter(Boolean)]);
          }
          setTotal(response.data.metadata?.total_count ?? response.data.prods.length);
          totalCountRef.current = response.data.metadata?.total_count ?? response.data.prods.length;
        } else {
          if (reset) setProductList([]);
          setError('상품을 불러오는데 실패했습니다.');
        }
      } else {
        const body = buildSearchBody();
        const response = await axiosAuth.post<SearchApiResponse>(SEARCH_API_URL, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });

        if (
          response.status === 200 &&
          response.data &&
          Array.isArray(response.data.prods)
        ) {
          if (reset) {
            setProductList(response.data.prods.filter(Boolean));
          } else {
            setProductList(prev => [...prev, ...response.data.prods.filter(Boolean)]);
          }
          setTotal(response.data.metadata?.total_count ?? response.data.prods.length);
          totalCountRef.current = response.data.metadata?.total_count ?? response.data.prods.length;
        } else {
          if (reset) setProductList([]);
          setError('상품을 불러오는데 실패했습니다.');
        }
      }
    } catch (e: any) {
      setError('상품을 불러오는데 실패했습니다.');
      if (reset) setProductList([]);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, sortType, minPriceInput, maxPriceInput, guideSel]);

  useEffect(() => {
    setPage(0);
    fetchProducts(true);
  }, [sortType, minPriceInput, maxPriceInput, guideSel]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    fetchProducts(true).finally(() => setRefreshing(false));
  }, [fetchProducts]);

  const handleLoadMore = () => {
    if (!loading && !isLoadingMore && productList.length < totalCountRef.current) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page === 0) return;
    fetchProducts(false);
  }, [page, fetchProducts]);

  // 멀티선택 가이드 버튼
  const renderGuideOptions = (
    selectedList: string[],
    onChange: (arr: string[]) => void
  ) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
      {GUIDE_OPTIONS.map(opt => {
        const checked = selectedList.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.grey200,
              backgroundColor: checked ? colors.blue50 : '#fff',
              marginRight: 8,
              marginBottom: 8,
            }}
            onPress={() => {
              let next: string[];
              if (checked) {
                next = selectedList.filter(v => v !== opt.value);
              } else {
                next = [...selectedList, opt.value];
              }
              onChange(next);
            }}
          >
            <Text typography="t6" color={checked ? colors.blue500 : colors.grey700}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // 정렬 바텀시트
  const openSortSheet = () => {
    bottomSheet.open({
      children: (
        <View style={{ paddingVertical: 24 }}>
          <View style={{ paddingHorizontal: 24 }}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 20,
                }}
                onPress={() => {
                  setSortType(option.value);
                  bottomSheet.close();
                }}
              >
                <Text typography="t5" fontWeight="medium" color={colors.grey700} style={{ flex: 1 }}>
                  {option.label}
                </Text>
                {sortType === option.value && (
                  <Icon name="icon-check-mono" color={colors.blue500} size={24} />
                )}
              </Pressable>
            ))}
          </View>
          <BottomSheet.CTA onPress={() => bottomSheet.close()}>
            취소
          </BottomSheet.CTA>
        </View>
      ),
    });
  };

  const openFilterSheet = () => {
    function FilterSheetContent() {
      const [tempGuide, setTempGuide] = useState<string[]>(guideSel);
      const [tempMinPrice, setTempMinPrice] = useState<string>(minPriceInput);
      const [tempMaxPrice, setTempMaxPrice] = useState<string>(maxPriceInput);

      return (
        <ScrollView style={{ padding: 24, paddingBottom: 32 }}>
          <Text typography="t4" fontWeight="bold" color={colors.grey900} style={{ marginBottom: 8 }}>
            가이드
          </Text>
          {renderGuideOptions(tempGuide, setTempGuide)}
          <Text typography="t4" fontWeight="bold" color={colors.grey900} style={{ marginBottom: 8 }}>
            가격
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
            <TextInput
              value={tempMinPrice}
              keyboardType="numeric"
              onChangeText={setTempMinPrice}
              placeholder="최소"
              style={{
                flex: 1, borderWidth: 1, borderColor: colors.grey300, borderRadius: 8, padding: 8, marginRight: 6
              }}
            />
            <Text style={{ marginHorizontal: 6, color: colors.grey700 }}>~</Text>
            <TextInput
              value={tempMaxPrice}
              keyboardType="numeric"
              onChangeText={setTempMaxPrice}
              placeholder="최대"
              style={{
                flex: 1, borderWidth: 1, borderColor: colors.grey300, borderRadius: 8, padding: 8, marginLeft: 6
              }}
            />
          </View>
          <BottomSheet.CTA
            onPress={() => {
              setGuideSel(tempGuide);
              setMinPriceInput(tempMinPrice);
              setMaxPriceInput(tempMaxPrice);
              setPage(0);
              bottomSheet.close();
            }}
          >
            적용하기
          </BottomSheet.CTA>
        </ScrollView>
      );
    }
    bottomSheet.open({ children: <FilterSheetContent /> });
  };

  const renderHeader = () => (
    <View style={{ backgroundColor: '#fff' }}>
      <StepText
        title={'나그네님을 위한 맞춤 여행 상품'}
        subTitle1={'상품 추천'}
        subTitle2={'내 여정과 어울리는 여행 상품을 추천해드려요'}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: colors.red50,
            borderRadius: 18,
            alignItems: 'center',
            flexDirection: 'row',
            padding: 10,
            width: 232,
            marginBottom: 14,
          }}
        >
          <Icon name="icon-shopping-bag-red" color={colors.red300} size={22} style={{ marginHorizontal: 6 }} />
          <Text typography="t6" color={colors.red400} fontWeight="medium">
            최저가로 즐기는 특별한 여행!
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text typography="t7" color={colors.grey700}>
            총 {total}개
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}
              onPress={openFilterSheet}
            >
              <Icon name="icon-filter-mono" color={colors.blue500} size={18} />
            </Pressable>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={openSortSheet}
            >
              <Text typography="t7" color={colors.blue500} style={{ marginRight: 2 }}>
                {SORT_OPTIONS.find((opt) => opt.value === sortType)?.label || 'RECOMMEND'}
              </Text>
              <Icon name="icon-chevron-down-mono" color={colors.blue500} size={16} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  const isNoProduct =
    !loading &&
    (Array.isArray(productList) && productList.length === 0);

  if (loading && !refreshing) {
    return (
      <AnimateSkeleton delay={400} withGradient={true} withShimmer={true}>
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

  if (error && !isNoProduct) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text typography="t4" color={colors.red400} style={{ marginBottom: 14 }}>
          {typeof error === 'string' ? error : '상품을 불러오는데 실패했습니다.'}
        </Text>
        <Button onPress={onRefresh}>다시 시도</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={productList.filter(
          (item, idx, arr) => arr.findIndex(v => v.prod_no === item.prod_no) === idx
        )}
        keyExtractor={(item, idx) => `${item.prod_no}_${idx}`} // 중복 키 방지
        renderItem={({ item }) => {
          if (!item) return null;
          return (
            <ProductCard
              product={item}
              onPress={() => {
                navigation.navigate('/product/good-product', { product: item });
                console.log(item.prod_no);
              }}
            />
          );
        }}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          (productList.length < totalCountRef.current) ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Button onPress={handleLoadMore} loading={isLoadingMore}>
                더 불러오기
              </Button>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isNoProduct ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text typography="t4" color={colors.grey500} style={{ marginBottom: 10 }}>
                조건에 맞는 상품이 없습니다.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}