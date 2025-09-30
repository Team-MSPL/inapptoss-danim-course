import React from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { PlaceResult } from "../../components/join/type";
import { Badge, BottomCTA, colors, FixedBottomCTAProvider, Text } from '@toss-design-system/react-native';
import { useAppDispatch } from "../../src/store";
import { travelSliceActions } from "../../redux/travle-slice";
import { useRegionSearchStore } from "../../zustand/regionSearchStore";
import { koreaCityList } from "../../utill/city-list";

export const Route = createRoute('/join/result-detail', {
  validateParams: (params) => params,
  component: JoinResultDetail,
});

// 이름 기반 상태 업데이트 로직
function getRegionStateByName(name: string) {
  // 하드코딩 케이스
  const hardCodeMap: Record<string, { cityIndex: number }> = {
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

  // 서울/제주/부산/대구/인천/광주/대전/울산/세종
  if (name in hardCodeMap) {
    const info = hardCodeMap[name];
    // 서울, 제주는 region을 ["전체"], cityDistance는 [0]
    if (name === '서울' || name === '제주') {
      return {
        region: ['전체'],
        cityIndex: info.cityIndex,
        cityDistance: [0],
      };
    }
    // 부산~세종은 광역시 하위
    return {
      region: [name],
      cityIndex: info.cityIndex,
      cityDistance: [info.subIdx ?? 0],
    };
  }

  // 나머지는 '강원 동해시' 등 띄어쓰기
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

  // fallback: 만약 못찾으면 그냥 전체
  if (cityIndex === -1) {
    cityIndex = 0;
    cityDistance = [0];
    region = ['전체'];
  }

  return { region, cityIndex, cityDistance };
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

  const handleNext = () => {
    const tendencyList = storeState.selectList;

    // 이름 기반으로 상태 추출
    const { region, cityIndex, cityDistance } = getRegionStateByName(place?.name ?? '');

    // 필드 업데이트
    dispatch(travelSliceActions.updateFiled({ field: 'tendency', value: tendencyList }));
    dispatch(travelSliceActions.updateFiled({ field: 'country', value: 0 }));
    dispatch(travelSliceActions.updateFiled({ field: 'region', value: region }));
    dispatch(travelSliceActions.updateFiled({ field: 'popular', value: 10 }));
    dispatch(travelSliceActions.updateFiled({ field: 'distance', value: 10 }));
    dispatch(travelSliceActions.updateFiled({ field: 'cityIndex', value: cityIndex }));
    dispatch(travelSliceActions.updateFiled({ field: 'cityDistance', value: cityDistance }));

    navigation.navigate('/join/enroll-route')
  };

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
        {/* 여행지명 + 태그 */}
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
          {/* 인기 여행지 Top 5 */}
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