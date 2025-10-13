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
import { useProductStore } from '../../zustand/useProductStore';
import axiosAuth from "../../redux/api";
import {useAppSelector} from "../../src/store";
import { buildKKdaySearchBody } from '../../kkday/kkdayBodyBuilder';

const SORT_OPTIONS = [
  { label: '추천순', value: 'recommend' },
  { label: '높은 가격순', value: 'price_desc' },
  { label: '낮은 가격순', value: 'price_asc' },
  { label: '높은 평점순', value: 'score_desc' },
  { label: '낮은 평점순', value: 'score_asc' },
];

const DEPART_TIME_OPTIONS = ['새벽', '오전', '오후', '야간'];
const TOUR_TYPE_OPTIONS = ['개인', '단체', '세미'];
const GUIDE_OPTIONS = ['한국어', '영어'];
const PRICE_MIN = 0;
const PRICE_MAX = 1000000;

const API_URL = 'https://api-b2d.kkday.com/v4/Search';

export default function MainTravelShop() {
  const navigation = useNavigation();
  const {
    productList, total, loading, error,
    sortType, setSortType,
    filter, setFilter,
    setProductList, setLoading, setError,
  } = useProductStore();
  const jwtToken = useAppSelector(state => state.travelSlice.userJwtToken);

  const [refreshing, setRefreshing] = useState(false);
  const bottomSheet = useBottomSheet();

  // 가격 및 필터 입력값 state
  const [minPriceInput, setMinPriceInput] = useState(filter.minPrice.toString());
  const [maxPriceInput, setMaxPriceInput] = useState(filter.maxPrice.toString());
  const [departTimeSel, setDepartTimeSel] = useState(filter.departTime[0] ?? '');
  const [tourTypeSel, setTourTypeSel] = useState(filter.tourType[0] ?? '');
  const [guideSel, setGuideSel] = useState(filter.guide[0] ?? '');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 예시 변수 (필요한 값들은 실제 상태/입력값으로 대체)
      const countryKeys = ['VN']; // 나라 필터 (국가코드 배열)
      const pageSize = 20; // 한 페이지에 보여줄 상품 수
      const start = 0; // 페이징 시작점
      const sort = 'RECOMMEND'; // 정렬 방식 (RECOMMEND, PDESC, PASC, HDESC, SDESC)
      const priceFrom = 0;      // 가격 최소값
      const priceTo = 1000000;  // 가격 최대값
      const guideLangs = ['한국어']; // 가이드 언어
      const keywords = '';      // 키워드 검색
      const catKeys = [];       // 카테고리 태그
      const cityKeys = [];      // 도시 태그
      const durations = [];     // 소요시간
      const facets = [];
      const hasPkg = null;
      const haveTranslate = null;
      const instantBooking = null;
      const locale = 'ko';
      const productCategories = [];
      const state = null;
      const stats = [];
      const tourism = null;
      const dateFrom = null;
      const dateTo = null;

// body 객체 생성
      const body = buildKKdaySearchBody({
        facets: ['tag', 'country_city', 'product_category'],
        country_keys: ['A01-001'],
        city_keys: ['A01-001-00001'],
        cat_keys: ['TAG_1_1'],
        page_size: 1000,
        date_from: '2023-07-01',
        date_to: '2023-07-31',
        guide_langs: ['zh-tw', 'en'],
        price_from: '100',
        price_to: '10000',
        keywords: 'Search Keywords',
        sort: 'PDESC',
        start: 0,
        durations: ['0,24', '24,48', '72,*'],
        stats: ['price'],
        locale: 'zh-tw',
        state: 'TW',
        has_pkg: true,
        tourism: true,
        have_translate: true,
        instant_booking: true,
        product_categories: ['CATEGORY_012'],
      });

// 빈 값(undefined) 제거
      Object.keys(body).forEach(
        (k) =>
          (body[k] === undefined ||
            body[k] === '' ||
            (Array.isArray(body[k]) && body[k].length === 0)) &&
          delete body[k]
      );

// body를 콘솔로 확인
      console.log('최종 KKday API body:', body);

      // 콘솔
      console.log('[KKday API 요청 body]', body);

      const response = await axios.post(
        API_URL,
        {
          "facets": [
            "tag",
            "country_city",
            "product_category"
          ],
          "country_keys": [
            "A01-001"
          ],
          "city_keys": [
            "A01-001-00001"
          ],
          "cat_keys": [
            "TAG_1_1"
          ],
          "page_size": 1000,
          "date_from": "2023-07-01",
          "date_to": "2023-07-31",
          "guide_langs": [
            "zh-tw",
            "en"
          ],
          "price_from": "100",
          "price_to": "10000",
          "keywords": "Search Keywords",
          "sort": "PDESC",
          "start": 0,
          "durations": [
            "0,24",
            "24,48",
            "72,*"
          ],
          "stats": [
            "price"
          ],
          "locale": "zh-tw",
          "state": "TW",
          "has_pkg": true,
          "tourism": true,
          "have_translate": true,
          "instant_booking": true,
          "product_categories": [
            "CATEGORY_012"
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          }
        }
      );

      console.log('[KKday API 응답]', response.data);

      setProductList(response.data.prods || [], response.data.total_count || 0);
      setLoading(false);
    } catch (e: any) {
      if (e.response) {
        console.error('[KKday API 에러]', e.response.status, e.response.data);
      } else {
        console.error('[KKday API 에러]', e);
      }
      setError('상품을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  }, [
    sortType, minPriceInput, maxPriceInput,
    departTimeSel, tourTypeSel, guideSel,
    setProductList, setLoading, setError,
  ]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortType, minPriceInput, maxPriceInput, departTimeSel, tourTypeSel, guideSel]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, [fetchProducts]);

  // 정렬 바텀시트 (open 함수형)
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

  // 옵션 버튼 커스텀 (SegmentedControl 대체)
  const renderOptionRow = (
    options: string[],
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

  // 필터 바텀시트 (open 함수형, SegmentedControl 없이 커스텀)
  const openFilterSheet = () => {
    // 내부 임시 변수(로컬 state X, 클로저로 처리)
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
                {SORT_OPTIONS.find((opt) => opt.value === sortType)?.label || '추천순'}
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
    ((Array.isArray(productList) && productList.length === 0) ||
      (productList &&
        typeof productList === 'object' &&
        (productList as any).message === '조건에 맞는 판매 상품이 없습니다.'));

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
        data={
          isNoProduct
            ? []
            : Array.isArray(productList) && productList.length > 0
              ? productList
              : []
        }
        keyExtractor={(item) => item?.prod_no ?? item?._id ?? Math.random().toString()}
        renderItem={({ item }) => {
          if (!item) return null;
          // KKday API에 맞게 상품 속성에 접근해야 함
          return <ProductCard product={item} onPress={() => {}} />;
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