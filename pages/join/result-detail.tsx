import React, {useEffect, useState} from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, FlatList } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { PlaceResult } from "../../components/join/type";
import { Badge, BottomCTA, colors, FixedBottomCTAProvider, Text } from '@toss-design-system/react-native';
import {useAppDispatch, useAppSelector} from "../../src/store";
import { travelSliceActions } from "../../redux/travle-slice";
import { useRegionSearchStore } from "../../zustand/regionSearchStore";
import { koreaCityList } from "../../utill/city-list";
import { useRegionModeStore } from '../../zustand/modeStore';
import axiosAuth from "../../redux/api";
import HorizontalProductCard, { SmallProduct } from '../../components/product/HorizontalProductCard';
import { useRecommendStore } from "../../zustand/recommendStore";
import { useCountryStore } from '../../zustand/countryStore';

export const Route = createRoute('/join/result-detail', {
  validateParams: (params) => params,
  component: JoinResultDetail,
});

function getRegionStateByName(name: string) {
  const hardCodeMap: Record<string, { cityIndex: number; subIdx?: number }> = {
    '서울': { cityIndex: 1 },
    '제주': { cityIndex: 11 },
    '부산': { cityIndex: 2, subIdx: 0 },
    '대구': { cityIndex: 2, subIdx: 1 },
    '인천': { cityIndex: 2, subIdx: 2 },
    '광주': { cityIndex: 2, subIdx: 3 },
    '대전': { cityIndex: 2, subIdx: 4 },
    '울산': { cityIndex: 2, subIdx: 5 },
    '세종': { cityIndex: 2, subIdx: 6 },
  };

  if (name in hardCodeMap) {
    const info = hardCodeMap[name];
    if (name === '서울' || name === '제주') {
      return {
        region: ['전체'],
        cityIndex: info.cityIndex,
        cityDistance: [0],
      };
    }
    return {
      region: [name],
      cityIndex: info.cityIndex,
      cityDistance: [info.subIdx ?? 0],
    };
  }

  const [title, subTitle] = name.split(' ');
  let cityIndex = -1;
  let cityDistance: number[] = [];
  let region: string[] = [];

  for (let i = 0; i < koreaCityList.length; i++) {
    if (koreaCityList[i].title === title) {
      cityIndex = i;
      for (let sub of koreaCityList[i].sub) {
        if (sub.subTitle === subTitle) {
          cityDistance.push(sub.id);
          region.push(sub.subTitle);
        }
      }
    }
  }

  if (cityIndex === -1) {
    cityIndex = 0;
    cityDistance = [0];
    region = ['전체'];
  }

  return { region, cityIndex, cityDistance };
}

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

function PopularPlaceCardBig({ place }: { place: PlaceResult }) {
  return (
    <View style={styles.popularCardBig}>
      <Image source={{ uri: place.photo }} style={styles.popularCardBigImage} />
      <View style={styles.popularCardOverlay} />
      <View style={styles.popularCardRankBig}>
        <Text style={styles.popularCardRankTextBig}>1</Text>
      </View>
      <Text typography="st5" fontWeight="semibold" color={colors.white} style={styles.popularCardNameBig} numberOfLines={1}>{place.name}</Text>
    </View>
  );
}

function PopularPlaceCard({ place, idx }: { place: PlaceResult, idx: number }) {
  return (
    <View style={styles.popularCard}>
      <Image source={{ uri: place.photo }} style={styles.popularCardImage} />
      <View style={styles.popularCardOverlay} />
      <View style={styles.popularCardRank}>
        <Text style={styles.popularCardRankText}>{idx + 2}</Text>
      </View>
      <Text typography="t4" fontWeight="semibold" color={colors.white} style={styles.popularCardName} numberOfLines={1}>{place.name}</Text>
    </View>
  );
}

function JoinResultDetail() {
  const params = Route.useParams();
  const place: PlaceResult = params.place;
  const topPopularPlaceList = place.topPopularPlaceList ?? [];
  const navigation = useNavigation();
  const storeState = useRegionSearchStore((state) => state);
  const dispatch = useAppDispatch();
  const tendencyList = storeState.selectList;
  const { region, cityIndex, cityDistance } = getRegionStateByName(place?.name ?? '');
  const {presetDatas, season, country} = useAppSelector(state => state.travelSlice);

  const selectedCountryKo = useCountryStore((s) => s.selectedCountryKo);

  const [recommended, setRecommended] = useState<SmallProduct[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const setRecommendBody = useRecommendStore((s) => s.setRecommendBody);

  useEffect(() => {
    handleProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProduct() {
    try {
      setRecLoading(true);

      const apiCountry = selectedCountryKo ?? '한국';

      const data: any = {
        pathList: [[]],
        selectList: [...(tendencyList ?? []), (season ?? [])],
        country: apiCountry,
        cityList: [place.name],
        topK: 10,
      };

      setRecommendBody(data);

      try { console.debug('[handleProduct] axiosAuth.defaults.headers:', axiosAuth.defaults?.headers); } catch (e) {}

      const directResp = await axiosAuth.post('sellingProduct/recommend', data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      const prods = extractProductsFromResponse(directResp.data);

      const mapped: SmallProduct[] = (prods ?? []).map((p:any, idx:number) => ({
        prod_no: p.prod_no ?? p._id ?? p.prodNo ?? `idx_${idx}`,
        prod_name: p.prod_name ?? p.prodName ?? p.name ?? '',
        prod_img_url: p.prod_img_url ?? p.prod_img ?? p.product_img_url ?? '',
        b2c_price: typeof p.b2c_price === 'number' ? p.b2c_price : (p.price ?? 0),
        b2b_price: typeof p.b2b_price === 'number' ? p.b2b_price : (p.sale_price ?? 0),
        avg_rating_star: p.avg_rating_star ?? p.avgRating ?? 0,
        rating_count: p.rating_count ?? p.review_count ?? 0,
        introduction: p.introduction ?? '',
        product_category: p.product_category ?? {},
      }));

      console.debug('[handleProduct] mapped length:', mapped.length, mapped.slice(0,3));
      setRecommended(mapped);
    } catch (err) {
      console.warn('[handleProduct] error', err);
      setRecommended([]);
    } finally {
      setRecLoading(false);
    }
  }

  const handleNext = () => {
    dispatch(travelSliceActions.updateFiled({ field: 'tendency', value: tendencyList }));
    dispatch(travelSliceActions.updateFiled({ field: 'country', value: 0 }));
    dispatch(travelSliceActions.updateFiled({ field: 'region', value: region }));
    dispatch(travelSliceActions.updateFiled({ field: 'popular', value: 10 }));
    dispatch(travelSliceActions.updateFiled({ field: 'distance', value: 10 }));
    dispatch(travelSliceActions.updateFiled({ field: 'cityIndex', value: cityIndex }));
    dispatch(travelSliceActions.updateFiled({ field: 'cityDistance', value: cityDistance }));

    useRegionModeStore.getState().setRegionMode('join');
    navigation.navigate('/join/enroll-route')
  };

  const locationLabel = place?.name ?? (selectedCountryKo ?? '한국');

  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: place.photo }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.contentBox}>
          <Text typography="st5" fontWeight="bold" color={colors.black}>{place.name}</Text>
          <View style={{ backgroundColor: colors.grey100, width: Dimensions.get("window").width, height: 1, marginVertical: 20, right: 24 }}></View>
          <View style={styles.tagsRow}>
            {(place.tendency ?? []).map((tag, idx) => (
              <Badge key={idx} fontWeight="normal" size="medium" badgeStyle="weak" type="blue">
                {tag}
              </Badge>
            ))}
          </View>

          {topPopularPlaceList.length > 0 && (
            <View style={styles.popularSection}>
              <Text typography="t4" fontWeight="bold" color={colors.black}>인기 여행지 Top 5</Text>
              <Text typography="t6" fontWeight="normal" color={colors.grey600} style={{ marginBottom: 20 }}>해당 지역의 인기 여행지를 확인하세요</Text>
              <PopularPlaceCardBig place={topPopularPlaceList[0]} />
              <View style={styles.popularGrid}>
                {topPopularPlaceList.slice(1, 5).map((popularPlace, idx) => (
                  <PopularPlaceCard place={popularPlace} idx={idx} key={popularPlace.name + idx} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.popularSection}>
            <Text typography="t4" fontWeight="bold" color={colors.black}>여행 상품 추천</Text>
            <Text typography="t6" fontWeight="normal" color={colors.grey600} style={{ marginBottom: 20 }}>
              {`현재 ${locationLabel}에서 인기 있는 여행 상품이에요!`}
            </Text>

            {recLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 8 }}>
                {[...Array(3)].map((_, i) => (
                  <View key={i} style={{ width: 200, height: 180, marginRight: 12, borderRadius: 12, backgroundColor: '#f0f0f0' }} />
                ))}
              </ScrollView>
            ) : (
              <FlatList
                data={recommended}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(it, idx) => `${it.prod_no ?? 'prod'}_${idx}`}
                renderItem={({ item }) => (
                  <HorizontalProductCard
                    product={item}
                    onPress={() => navigation.navigate('/product/good-product', { product: item })}
                  />
                )}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>

        </View>
        <BottomCTA.Single
          type="primary"
          style="fill"
          onPress={handleNext}>
          이 지역의 여행 일정 추천 받기
        </BottomCTA.Single>
      </FixedBottomCTAProvider>
    </View>
  );
}

const width = Dimensions.get('window').width;
const IMAGE_HEIGHT = 220;
const CARD_BIG_HEIGHT = 200;
const CARD_BIG_RADIUS = 28;
const CARD_SIZE = (width - 24 * 2 - 14) / 2;
const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingBottom: 36,
    backgroundColor: '#F5F6FA',
  },
  imageContainer: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: '#EEE',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: -18,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  contentBox: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
    minHeight: 350,
    marginTop: -10,
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  popularSection: {
    marginTop: 18,
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  popularDesc: {
    fontSize: 13,
    color: '#A0A4B8',
    marginBottom: 14,
  },
  popularCardBig: {
    width: '100%',
    height: CARD_BIG_HEIGHT,
    borderRadius: CARD_BIG_RADIUS,
    backgroundColor: '#D7DDF0',
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  popularCardBigImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: CARD_BIG_RADIUS,
  },
  popularCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: CARD_BIG_RADIUS,
  },
  popularCardRankBig: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#B3F125',
    borderRadius: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  popularCardRankTextBig: {
    color: colors.grey700,
    fontWeight: 'bold',
    fontSize: 14,
  },
  popularCardNameBig: {
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingBottom: 19,
    zIndex: 3,
    width: '100%',
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  popularCard: {
    width: CARD_SIZE,
    height: 200,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#D7DDF0',
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  popularCardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: CARD_RADIUS,
  },
  popularCardRank: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#B3F125',
    borderRadius: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  popularCardRankText: {
    color: colors.grey700,
    fontWeight: 'bold',
    fontSize: 14,
  },
  popularCardName: {
    textAlign: 'left',
    paddingHorizontal: 14,
    paddingBottom: 15,
    zIndex: 3,
    width: '100%',
  },
});

export default JoinResultDetail;