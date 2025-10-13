import React, { useEffect, useCallback, useState } from 'react';
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
} from '@toss-design-system/react-native';
import ProductCard from '../../components/main/product-card';
import { StepText } from '../../components/step-text';

const SORT_OPTIONS = [
  { label: '추천순', value: 'RECOMMEND' },
  { label: '높은 가격순', value: 'PDESC' },
  { label: '낮은 가격순', value: 'PASC' },
  { label: '높은 평점순', value: 'SDESC' }
] as const;

const DEPART_TIME_OPTIONS = ['새벽', '오전', '오후', '야간'] as const;
const TOUR_TYPE_OPTIONS = ['개인', '단체', '세미'] as const;
const GUIDE_OPTIONS = ['한국어', '영어'] as const;
const PRICE_MIN = 0;
const PRICE_MAX = 1000000;

const SEARCH_API_URL = 'https://danimdatabase.com/kkday/Search';

// 타입 정의
type Country = {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
};

type ProductCategory = {
  main: string;
  sub: string[];
};

type Product = {
  prod_no: number;
  prod_name: string;
  prod_img_url: string;
  b2c_price: number;
  b2b_price: number;
  avg_rating_star: number;
  rating_count: number;
  countries: Country[];
  introduction: string;
  prod_type: string;
  tag?: string[];
  instant_booking: boolean;
  product_category: ProductCategory;
  [key: string]: unknown;
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

export default function MainTravelShop() {
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();

  // 상태 타입 엄격히 지정
  const [productList, setProductList] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [sortType, setSortType] = useState<typeof SORT_OPTIONS[number]['value']>('RECOMMEND');
  const [filter, setFilter] = useState<{
    departTime: string[];
    tourType: string[];
    guide: string[];
    minPrice: number;
    maxPrice: number;
  }>({
    departTime: [],
    tourType: [],
    guide: [],
    minPrice: PRICE_MIN,
    maxPrice: PRICE_MAX,
  });
  const [minPriceInput, setMinPriceInput] = useState<string>(String(PRICE_MIN));
  const [maxPriceInput, setMaxPriceInput] = useState<string>(String(PRICE_MAX));
  const [departTimeSel, setDepartTimeSel] = useState<string>('');
  const [tourTypeSel, setTourTypeSel] = useState<string>('');
  const [guideSel, setGuideSel] = useState<string>('');

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 상품 목록 불러오기
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      // 실사용 시 필터/정렬 값 body에 추가
      // body.sortType = sortType;
      // body.minPrice = Number(minPriceInput) || PRICE_MIN;
      // body.maxPrice = Number(maxPriceInput) || PRICE_MAX;
      // body.departTime = departTimeSel ? [departTimeSel] : [];
      // body.tourType = tourTypeSel ? [tourTypeSel] : [];
      // body.guide = guideSel ? [guideSel] : [];

      const response = await axios.post<SearchApiResponse>(SEARCH_API_URL, body, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (
        response.status === 200 &&
        response.data &&
        Array.isArray(response.data.prods)
      ) {
        setProductList(response.data.prods.filter(Boolean));
        setTotal(response.data.metadata?.total_count || response.data.prods.length);
      } else {
        setProductList([]);
        setTotal(0);
        setError('상품을 불러오는데 실패했습니다.');
      }
      setLoading(false);
    } catch (e: any) {
      if (e?.response) {
        setError(
          e.response.data?.message ||
          `오류가 발생했습니다: ${e.response.statusText}`
        );
      } else {
        setError('상품을 불러오는데 실패했습니다.');
      }
      setProductList([]);
      setTotal(0);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, [fetchProducts]);

  const openSortSheet = () => {
    bottomSheet.open({
      children: (
        <View style={{ padding: 24 }}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.grey200,
              }}
              onPress={() => {
                setSortType(option.value);
                bottomSheet.close();
              }}
            >
              <Text typography="t4" color={colors.grey900} style={{ flex: 1 }}>
                {option.label}
              </Text>
              {sortType === option.value && (
                <Icon name="icon-check-mono" color={colors.blue500} size={18} />
              )}
            </Pressable>
          ))}
          <Button style={{ marginTop: 24 }} onPress={() => bottomSheet.close()}>
            취소
          </Button>
        </View>
      ),
    });
  };

  const renderOptionRow = (
    options: readonly string[],
    selected: string,
    onChange: (v: string) => void
  ) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 18,
            borderWidth: selected === opt ? 2 : 1,
            borderColor: selected === opt ? colors.blue500 : colors.grey300,
            backgroundColor: selected === opt ? colors.blue50 : '#fff',
            marginRight: 8,
            marginBottom: 8,
          }}
          onPress={() => onChange(opt)}
        >
          <Text typography="t6" color={selected === opt ? colors.blue500 : colors.grey700}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const openFilterSheet = () => {
    let tempDepart = departTimeSel;
    let tempTour = tourTypeSel;
    let tempGuide = guideSel;
    let tempMinPrice = minPriceInput;
    let tempMaxPrice = maxPriceInput;

    const setTempDepart = (v: string) => { tempDepart = v; };
    const setTempTour = (v: string) => { tempTour = v; };
    const setTempGuide = (v: string) => { tempGuide = v; };
    const setTempMinPrice = (v: string) => { tempMinPrice = v; };
    const setTempMaxPrice = (v: string) => { tempMaxPrice = v; };

    bottomSheet.open({
      children: (
        <ScrollView style={{ padding: 24, paddingBottom: 32 }}>
          <Text typography="t4" fontWeight="bold" color={colors.grey900} style={{ marginBottom: 8 }}>
            출발시간
          </Text>
          {renderOptionRow(DEPART_TIME_OPTIONS, tempDepart, setTempDepart)}
          <Text typography="t4" fontWeight="bold" color={colors.grey900} style={{ marginBottom: 8 }}>
            투어 유형
          </Text>
          {renderOptionRow(TOUR_TYPE_OPTIONS, tempTour, setTempTour)}
          <Text typography="t4" fontWeight="bold" color={colors.grey900} style={{ marginBottom: 8 }}>
            가이드
          </Text>
          {renderOptionRow(GUIDE_OPTIONS, tempGuide, setTempGuide)}
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
          <Button
            type="primary"
            style="fill"
            display="block"
            onPress={() => {
              setDepartTimeSel(tempDepart);
              setTourTypeSel(tempTour);
              setGuideSel(tempGuide);
              setMinPriceInput(tempMinPrice);
              setMaxPriceInput(tempMaxPrice);
              setFilter({
                departTime: tempDepart ? [tempDepart] : [],
                tourType: tempTour ? [tempTour] : [],
                guide: tempGuide ? [tempGuide] : [],
                minPrice: Number(tempMinPrice) || PRICE_MIN,
                maxPrice: Number(tempMaxPrice) || PRICE_MAX,
              });
              bottomSheet.close();
            }}
          >
            적용하기
          </Button>
        </ScrollView>
      ),
    });
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

  const isNoProduct = !loading && (Array.isArray(productList) && productList.length === 0);

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
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <FlatList
        data={isNoProduct ? [] : productList.filter(Boolean)}
        keyExtractor={(item) => item?.prod_no?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => {
          if (!item) return null;
          return (
            <ProductCard
              product={item}
              onPress={() => {
                // navigation.navigate('ProductDetail', { prod_no: item.prod_no });
              }}
            />
          );
        }}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
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