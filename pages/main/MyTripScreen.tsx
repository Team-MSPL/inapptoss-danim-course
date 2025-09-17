import React, { useCallback, useEffect, useRef, useState } from 'react';
import {Dimensions, Pressable, View} from 'react-native';
import { Flex, Image, useNavigation } from 'react-native-bedrock';
import { useAppDispatch, useAppSelector } from 'store';
import {
  getMyTravelList,
  getOneTravelCourse,
  getRegionInfo,
  travelSliceActions,
} from '../../redux/travle-slice';
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
import { FlatList } from '@react-native-bedrock/native/react-native-gesture-handler';
import moment from 'moment';
import { cityViewList} from "../../utill/city-list";

export default function MyTripScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { userId, userJwtToken } = useAppSelector((state) => state.travelSlice);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { open } = useToast();

  // 여행 리스트 불러오기
  const getTravelList = async () => {
    try {
      setLoading(true);
      const data = await dispatch(getMyTravelList({ userId })).unwrap();
      setList(data);
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTravelList();
  }, []);

  // 도시명 변환 함수
  const findCityFromPath = (path: string) => {
    const pathParts = path?.split('/');
    const targetCity = pathParts[2];
    const countryIndex = {
      Japan: 1,
      China: 2,
      Vietnam: 3,
      Tailand: 4,
      Philippines: 5,
      Singapore: 6,
    };
    for (const region of cityViewList[countryIndex[`${pathParts[1]}`]]) {
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
  };

  // 여행 상세로 이동
  const goMyTravelDetail = async (item: any) => {
    try {
      const data = await dispatch(getOneTravelCourse({ travelId: item._id })).unwrap();
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
    const startSign = Math.sign(moment.duration(moment(item.startDay).hours(0).diff(moment())).asDays());
    const endSign = Math.sign(moment.duration(moment(item.endDay).hours(0).diff(moment())).asDays());
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

  // 월별 구분 렌더링을 위한 ref
  const monthRef = useRef(moment().add(1, 'month').format('MM'));

  // 여행 리스트 렌더 아이템
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    let after = monthRef.current;
    monthRef.current = Array.isArray(item.day) && item.day.length > 0 ? moment(item.day[0]).format('MM') : '';
    const travelEndDay = Array.isArray(item.day) && item.day.length > 0
        ? ((typeof item.nDay === 'number' && item.nDay > 0 && item.nDay <= item.day.length)
            ? item.day[item.nDay - 1]
            : item.day[item.day.length - 1])
        : '';
    const travelStartDay = Array.isArray(item.day) && item.day.length > 0 ? item.day[0] : '';
    const regionLabel = Array.isArray(item.region) && item.region.length > 0
        ? item.region[0].split('/').at(-1)
        : '';

    // 썸네일 예시 (item.thumbnail이 있으면 그걸 사용)
    const DEFAULT_THUMBNAIL =
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';
    const thumbnail = item.thumbnail || DEFAULT_THUMBNAIL;

    return (
        <>
          {(monthRef.current !== after || index === 0) && (
              <Top.Root
                  title={
                    <Top.TitleParagraph typography="t7" color={colors.grey700}>
                      {travelEndDay ? moment(travelEndDay).format('YYYY년 MM월') : ''}
                    </Top.TitleParagraph>
                  }
              />
          )}
          <Pressable onPress={() => goMyTravelDetail(item)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 8 }}>
              <Image
                  source={{ uri: thumbnail }}
                  style={{
                    width: 105,
                    height: 105,
                    borderRadius: 10,
                    marginRight: 4,
                    marginLeft: 24,
                    backgroundColor: '#eee',
                  }}
                  resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Top.Root
                    right={<Icon name="icon-arrow-right-mono" color={colors.grey400} />}
                    title={<Top.TitleParagraph typography="t3">{item.travelName}</Top.TitleParagraph>}
                    subtitle1={
                      <Top.SubtitleParagraph typography="t7" color={colors.grey700} fontWeight="regular">
                        {travelStartDay && travelEndDay
                            ? `${moment(travelStartDay).format('YYYY년 MM월 DD일')} ~ ${moment(travelEndDay).format('MM월 DD일')}`
                            : ''}
                      </Top.SubtitleParagraph>
                    }
                    subtitle2={
                      <Top.SubtitleParagraph typography="t7" color={colors.blue600} fontWeight="medium">
                        {travelStartDay && travelEndDay
                            ? dDayCalculate({
                              startDay: travelStartDay,
                              endDay: travelEndDay,
                            }).result
                            : ''}
                        {'\n'}
                        <Badge type="teal" badgeStyle="weak">
                          {regionLabel}
                        </Badge>
                      </Top.SubtitleParagraph>
                    }
                />
              </View>
            </View>
          </Pressable>
        </>
    );
  };

  // 여행 목록 로딩 or 없을 때
  if (loading) {
    return (
      <AnimateSkeleton delay={500} withGradient={true} withShimmer={true}>
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} height={60} style={i > 0 ? { marginTop: 12 } : {}} />
        ))}
      </AnimateSkeleton>
    );
  }

  if (list.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginBottom: 100}}>
        <Top.Root
          upper={
            <Top.UpperAssetContent
              content={
                <Image
                  style={{ width: 68, height: 68 }}
                  source={{
                    uri: 'https://static.toss.im/2d-emojis/png/4x/u1F3DC.png',
                  }}
                />
              }
            />
          }
          title={
            <Top.TitleParagraph typography="t3">
              지금 바로 여행 일정을 추천받아{`\n`}신나는 여행을 떠나보세요
            </Top.TitleParagraph>
          }
          subtitle1={
            <Top.SubtitleParagraph typography="t7" color={colors.grey700} fontWeight="regular">
              나그네님을 위한 일정이 곧 채워질 거에요
            </Top.SubtitleParagraph>
          }
          style={{width: Dimensions.get('window').width - 20}}
        />
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
  }

  // 여행 리스트 있을 때
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
            data={list}
            style={{marginBottom: 100}}
            renderItem={renderItem}
            initialNumToRender={20}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item?._id}
            nestedScrollEnabled
        />
      </View>
  );
}