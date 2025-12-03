import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  View,
  StyleSheet,
  Image as RNImage,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { Image } from '@granite-js/react-native';
import { useAppDispatch, useAppSelector } from 'store';
import {
  getMyTravelList,
  getOneTravelCourse,
  getRegionInfo,
  travelSliceActions,
} from '../../redux/travle-slice';
import axiosAuth from '../../redux/api';
import {
  AnimateSkeleton,
  Badge,
  Button,
  colors,
  Icon,
  Skeleton,
  Text,
  Top,
  useToast,
} from '@toss-design-system/react-native';
import { FlatList } from '@granite-js/native/react-native-gesture-handler';
import moment from 'moment';
import { cityViewList } from '../../utill/city-list';
import { useRegionCheckStore } from "../../zustand/timetableStore";

// 월 헤더 라벨
function getMonthLabel(dateStr: string) {
  const now = moment();
  const date = moment(dateStr);
  if (now.year() === date.year() && now.month() === date.month()) {
    return '이번달';
  }
  return `${date.year()}년 ${date.month() + 1}월`;
}

// (수정) 최근 시작일(가장 나중에 시작하는 여행)부터 내림차순 정렬
function sortTravelListByStartDayDesc(list: any[]) {
  return [...list].sort((a, b) => {
    const aStart = Array.isArray(a.day) && a.day.length > 0 ? moment(a.day[0]) : moment('0000-01-01');
    const bStart = Array.isArray(b.day) && b.day.length > 0 ? moment(b.day[0]) : moment('0000-01-01');
    return bStart.diff(aStart); // b - a => descending
  });
}

// (수정) 내림차순 정렬된 리스트를 받아, 최신 월부터 헤더를 붙이는 함수
function makeMonthHeaderizedListDescending(travelList: any[]) {
  if (!travelList || travelList.length === 0) return [];
  const sorted = sortTravelListByStartDayDesc(travelList);
  const result: any[] = [];
  let lastMonthKey = '';
  for (const item of sorted) {
    const travelEndDay =
      Array.isArray(item.day) && item.day.length > 0
        ? typeof item.nDay === 'number' && item.nDay > 0 && item.nDay <= item.day.length
          ? item.day[item.nDay - 1]
          : item.day[item.day.length - 1]
        : '';
    const monthKey = travelEndDay ? moment(travelEndDay).format('YYYY-MM') : '';
    const isCurrentMonth =
      travelEndDay && moment().year() === moment(travelEndDay).year() && moment().month() === moment(travelEndDay).month();
    if (monthKey && monthKey !== lastMonthKey) {
      result.push({ type: 'header', monthKey, isCurrentMonth, dateStr: travelEndDay });
      lastMonthKey = monthKey;
    }
    result.push({ type: 'item', item });
  }
  return result;
}

export default function MainTrip() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { userId, userJwtToken } = useAppSelector((state) => state.travelSlice);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { open } = useToast();

  // track currently deleting id to show spinner
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // map to track whether a long-press was activated for a given travelId
  const longPressActivatedRef = useRef<Map<string, boolean>>(new Map());
  // map to hold timers for press-in per travelId (for manual long-press)
  const pressTimerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 여행 리스트 불러오기
  const getTravelList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dispatch(getMyTravelList({ userId })).unwrap();
      setList(sortTravelListByStartDayDesc(data ?? []));
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    getTravelList();
  }, [getTravelList]);

  useEffect(() => {
    // cleanup timers on unmount
    return () => {
      pressTimerMapRef.current.forEach((t) => clearTimeout(t));
      pressTimerMapRef.current.clear();
    };
  }, []);

  // 도시명 변환 함수
  const findCityFromPath = (path: string) => {
    const pathParts = path?.split('/');
    const targetCity = pathParts[2];
    const countryIndex: any = {
      Japan: 1,
      China: 2,
      Vietnam: 3,
      Tailand: 4,
      Philippines: 5,
      Singapore: 6,
    };
    for (const region of cityViewList[countryIndex[`${pathParts[1]}`]] || []) {
      for (const city of region.sub) {
        if (city.subTitle === targetCity) {
          if (region.title !== '인기') {
            return path?.replace(
              targetCity,
              `${region.title.normalize('NFD')} ${
                region?.eng?.normalize('NFD') ?? ''
              }${region?.eng ? ' ' : ''}!${targetCity}`,
            );
          }
        }
      }
    }
    return path;
  };

  // 여행 상세로 이동
  const goMyTravelDetail = async (item: any) => {
    try {
      const data = await dispatch(getOneTravelCourse({ travelId: item._id })).unwrap();
      console.log(data);

      const setRegionCheck = useRegionCheckStore.getState?.()?.setRegionCheck ?? useRegionCheckStore((s) => s.setRegionCheck);
      // Ensure we only pass an array; fallback to empty array for safety
      const regionArray = Array.isArray(data?.region) ? data.region : [];
      setRegionCheck(regionArray);

      dispatch(
        getRegionInfo({
          region: data?.region[0].includes('해외')
            ? findCityFromPath(data?.region[0])
            : data.region[0].replace(
              /도심권| 동남권| 동북권|서남권|서북권|서귀포시|제주시'/g,
              '전체',
            ),
        }),
      );
      navigation.navigate('/timetable');
    } catch (err) {
      open('코스 가져오던 중 문제가 생겼어요. 잠시후 시도해주세요');
    }
  };

  // 여행 D-Day 상태 계산
  const dDayCalculate = useCallback((item: any) => {
    const startSign = Math.sign(
      moment.duration(moment(item.startDay).hours(0).diff(moment())).asDays(),
    );
    const endSign = Math.sign(
      moment.duration(moment(item.endDay).hours(0).diff(moment())).asDays(),
    );
    let result = '';
    let startStatus = moment.duration(moment(item.startDay).hours(0).diff(moment())).asDays() * -1;
    let endStatus = moment.duration(moment(item.endDay).hours(0).diff(moment())).asDays() * -1;
    let endFlag = false;

    if (startStatus > 0 && startStatus < 1) {
      result = '여행을 떠나는 날이에요';
    } else if (startSign === 1) {
      result = `여행가기${Math.ceil(moment.duration(moment(item.startDay).hours(0).diff(moment())).asDays())}일 전`;
    } else if (startSign === -1 && endSign === 1) {
      result = '신나는 여행 중이에요';
    } else if (endStatus > 0 && endStatus < 1) {
      result = '여행의 마지막 날이에요';
    } else if (endSign === -1) {
      result = `여행 후${(Math.floor(moment.duration(moment(item.endDay).hours(0).diff(moment())).asDays()) + 1) * -1}일`;
      endFlag = true;
    }

    return { result, endFlag };
  }, []);

  // Long-press delete handler: show confirmation and call delete API
  const confirmAndDelete = async (travelId: string) => {
    Alert.alert(
      '삭제',
      '삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(travelId);
              await axiosAuth.delete('/travelCourse/deleteTravelCourse', {
                data: { travelId },
              });
              open('여행 일정이 삭제되었습니다.');
              await getTravelList();
            } catch (err) {
              console.error('deleteTravelCourse error', err);
              open('삭제 중 오류가 발생했습니다. 잠시후 다시 시도해주세요.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // monthHeaderizedList (memoized)
  const monthHeaderizedList = useMemo(() => makeMonthHeaderizedListDescending(list), [list]);

  // renderItem
  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <Top.Root
          title={
            <Top.TitleParagraph typography="t7" color={colors.grey700}>
              {item.isCurrentMonth ? '이번달' : getMonthLabel(item.dateStr)}
            </Top.TitleParagraph>
          }
          style={{ backgroundColor: '#fff' }}
        />
      );
    }

    const travelItem = item.item;
    const travelEndDay =
      Array.isArray(travelItem.day) && travelItem.day.length > 0
        ? typeof travelItem.nDay === 'number' && travelItem.nDay > 0 && travelItem.nDay <= travelItem.day.length
          ? travelItem.day[travelItem.nDay - 1]
          : travelItem.day[travelItem.day.length - 1]
        : '';
    const travelStartDay = Array.isArray(travelItem.day) && travelItem.day.length > 0 ? travelItem.day[0] : '';
    const regionLabel =
      Array.isArray(travelItem.region) && travelItem.region.length > 0 ? travelItem.region[0].split('/').at(-1) : '';
    const DEFAULT_THUMBNAIL =
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';
    const thumbnail = travelItem.thumbnail || DEFAULT_THUMBNAIL;

    const dateLine =
      travelStartDay && travelEndDay
        ? `${moment(travelStartDay).format('YYYY/MM/DD')} - ${moment(travelEndDay).format('YYYY/MM/DD')}`
        : '';

    const dDayText =
      travelStartDay && travelEndDay
        ? dDayCalculate({
          startDay: travelStartDay,
          endDay: travelEndDay,
        }).result
        : '';

    // ensure map entry exists
    if (!longPressActivatedRef.current.has(travelItem._id)) {
      longPressActivatedRef.current.set(travelItem._id, false);
    }

    const handlePressIn = () => {
      // start timer for 1s
      const existing = pressTimerMapRef.current.get(travelItem._id);
      if (existing) {
        clearTimeout(existing);
      }
      longPressActivatedRef.current.set(travelItem._id, false);
      const t = setTimeout(() => {
        longPressActivatedRef.current.set(travelItem._id, true);
        confirmAndDelete(travelItem._id);
        pressTimerMapRef.current.delete(travelItem._id);
      }, 1000); // 1 second
      pressTimerMapRef.current.set(travelItem._id, t);
    };

    const handlePressOut = () => {
      const t = pressTimerMapRef.current.get(travelItem._id);
      if (t) {
        clearTimeout(t);
        pressTimerMapRef.current.delete(travelItem._id);
      }
      const wasLong = longPressActivatedRef.current.get(travelItem._id);
      if (!wasLong) {
        // treat as tap
        goMyTravelDetail(travelItem);
      } else {
        // reset flag after handling
        longPressActivatedRef.current.set(travelItem._id, false);
      }
    };

    return (
      <TouchableOpacity
        key={travelItem._id}
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.itemRow}>
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />

          <View style={styles.itemContent}>
            <Text typography="t7" color={colors.grey400} style={styles.dateText}>
              {dateLine}
            </Text>

            <Text typography="t5" color={colors.grey900} fontWeight="bold" numberOfLines={1} style={styles.titleText}>
              {travelItem.travelName}
            </Text>

            <Text typography="t7" color={colors.blue600} fontWeight="medium" numberOfLines={1} style={styles.ddayText}>
              {dDayText}
            </Text>

            <View style={styles.metaRow}>
              <Badge style={styles.badge} type="teal" badgeStyle="weak">
                {regionLabel}
              </Badge>
            </View>
          </View>

          <View style={styles.iconWrap}>
            {deletingId === travelItem._id ? (
              <ActivityIndicator />
            ) : (
              <Icon name="icon-arrow-right-mono" color={colors.grey400} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyUpper}>
        <RNImage style={styles.emptyImage} source={{ uri: 'https://static.toss.im/2d-emojis/png/4x/u1F3DC.png' }} />
      </View>
      <Text typography="t3" fontWeight="semibold" style={styles.emptyTitle}>
        지금 바로 여행 일정을 추천받아{'\n'}신나는 여행을 떠나보세요
      </Text>
      <Text typography="t7" color={colors.grey700} style={styles.emptySubtitle}>
        나그네님을 위한 일정이 곧 채워질 거에요
      </Text>
      <Button
        viewStyle={{ alignSelf: 'center', marginTop: 24 }}
        size="medium"
        style="weak"
        onPress={() => {
          dispatch(
            travelSliceActions.reset({
              userId,
              userJwtToken,
            }),
          );
          navigation.replace('/enroll/title');
        }}
      >
        여행 일정 추천 받으러 가기
      </Button>
    </View>
  );

  if (list.length === 0) {
    return <EmptyState />;
  }

  return (
    <View>
      <Top.Root
        title={
          <Top.TitleParagraph typography="t3" color={colors.grey900}>
            내 여행
          </Top.TitleParagraph>
        }
      />

      <FlatList
        data={monthHeaderizedList}
        style={{ marginBottom: 100 }}
        renderItem={renderItem}
        initialNumToRender={20}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, idx) =>
          item.type === 'header' ? `header-${item.monthKey}-${idx}` : item.item?._id
        }
        nestedScrollEnabled
        extraData={monthHeaderizedList.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100,
    paddingHorizontal: 20,
  },
  emptyUpper: {
    marginBottom: 12,
  },
  emptyImage: {
    width: 68,
    height: 68,
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  monthHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    backgroundColor: '#fff',
  },
  itemPressable: {
    paddingVertical: 8,
  },
  thumbnail: {
    width: 105,
    height: 105,
    borderRadius: 10,
    marginRight: 12,
    marginLeft: 24,
    backgroundColor: '#eee',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  dateText: {
    marginBottom: 4,
  },
  titleText: {
    marginBottom: 4,
  },
  ddayText: {
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  iconWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pageTitleWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
});