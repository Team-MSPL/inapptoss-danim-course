import {
  AnimateSkeleton,
  Badge,
  Border,
  BottomSheet,
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  LinearGradient,
  ListRow,
  Skeleton,
  Tab,
  Text,
  useBottomSheet,
  useToast,
} from '@toss-design-system/react-native';
import React, { useCallback, useState } from 'react';
import {Pressable, TouchableOpacity, View} from 'react-native';
import { createRoute, Stack, useNavigation } from '@granite-js/react-native';
import { Image } from '@granite-js/react-native';
import { useAppDispatch, useAppSelector } from 'store';
import { cityViewList } from '../utill/city-list';
import { useTendencyHandler } from '../hooks/useTendencyHandler';
import { EnrollWho } from './enroll/who';
import { EnrollTransit } from './enroll/transit';
import { EnrollBusy } from './enroll/busy';
import { StepText } from '../components/step-text';
import { routeStack } from '../utill/route-stack';
import { EnrollConcept } from './enroll/concept';
import { EnrollPlay } from './enroll/play';
import { EnrollPopular } from './enroll/popular';
import { EnrollDistance } from './enroll/distance';
import { getTravelAi, travelSliceActions } from '../redux/travle-slice';
import NavigationBar from '../components/navigation-bar';
import { EnrollTour } from './enroll/tour';
import {useRecentModeStore, useRegionModeStore} from "../zustand/modeStore";
import { koreaCityList } from "../utill/city-list";
import {patchRecentSelectList} from "../zustand/api";
import {regionList} from "./enroll/essential-search";

export const Route = createRoute('/final-check', {
  validateParams: (params) => params,
  component: FinalCheck,
});

function getProvinceWithCity(region: string[]): string[] {
  if (!region || region.length === 0) return [];
  return region.map((cityName) => {
    for (const cityGroup of koreaCityList) {
      if (cityGroup.sub.some(sub => sub.subTitle === cityName)) {
        return `${cityGroup.title} ${cityName}`;
      }
    }
    return cityName;
  });
}

function FinalCheck() {
  const {
    day,
    region,
    nDay,
    country,
    cityIndex,
    season,
    transit,
    bandwidth,
    tendency,
    popular,
    essentialPlaces,
    accommodations,
    regionInfo,
    travelName,
    distance,
    timeLimitArray,
  } = useAppSelector((state) => state.travelSlice);
  const navigation = useNavigation();
  const { open } = useToast();
  const seasonList = [
    { title: '봄', svg: 'https://static.toss.im/2d-emojis/png/4x/u1F33C.png' },
    {
      title: '여름',
      svg: 'https://static.toss.im/2d-emojis/png/4x/u1F3DD.png',
    },
    {
      title: '가을',
      svg: 'https://static.toss.im/2d-emojis/png/4x/u1F341.png',
    },
    { title: '겨울', svg: 'https://static.toss.im/2d-emojis/png/4x/u2744.png' },
  ];
  const [value, setValue] = useState('0');

  const { tendencyList, countryList } = useTendencyHandler();

  const moveList_transit = [
    {
      name: '자동차·렌트카',
      onPress: () => dispatch(travelSliceActions.enrollTransit(0)),
      icon: 'icon-car-blue',
    },
    {
      name: '대중교통',
      onPress: () => dispatch(travelSliceActions.enrollTransit(1)),
      icon: 'icon-train-blue',
    },
  ];

  const moveList_busy = [
    {
      name: '알찬 일정',
      onPress: () => dispatch(travelSliceActions.enrollBandwidth(false)),
      image: 'https://static.toss.im/2d-emojis/png/4x/u1F3C3.png',
    },
    {
      name: '여유있는 일정',
      onPress: () => dispatch(travelSliceActions.enrollBandwidth(true)),
      image: 'https://static.toss.im/2d-emojis/png/4x/u1F6B6.png',
    },
  ];

  const distance_list = [0, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 12.0, 13.5, 15.0, 16.5]

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const bottomSheet = useBottomSheet();
  const showHourBottomSheet = (e: number, num: number[]) => {
    bottomSheet.open({
      children: (
        <ModifyBottomSheetContent
          onCancel={() => {
            bottomSheet.close();
          }}
          startIndex={e}
          allowedSteps={num}
        />
      ),
    });
  };
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const goNext = useCallback(async () => {
    try {
      setLoading(true);

      if (
        travelName == '신나는 여행' &&
        tendencyList[0]?.list[tendency[0].findIndex((item) => item == 1)]
      ) {
        let changeName =
          tendencyList[0]?.list[tendency[0].findIndex((item) => item == 1)] +
          (tendency[0].findIndex((item) => item == 1) == 0 ||
          tendency[0].findIndex((item) => item == 1) == 4
            ? ' '
            : ' 함께하는 ') +
          seasonList[season.findIndex((item) => item == 1)].title +
          '여행';
        dispatch(travelSliceActions.enrollTravelName(changeName));
      }

      const regionMode = useRegionModeStore.getState().regionMode;
      let apiBody;

      if (regionMode === 'join') {
        // join 모드: regionList를 "도/광역시 + 시/군/구" 조합으로 생성
        await patchRecentSelectList(tendency);
        const regionList = getProvinceWithCity(region);
        apiBody = {
          regionList,
          accomodationList: accommodations,
          selectList: tendency,
          essentialPlaceList: essentialPlaces,
          timeLimitArray: timeLimitArray,
          nDay: nDay + 1,
          transit,
          distanceSensitivity: distance,
          bandwidth,
          freeTicket: true,
          version: 3,
          password: '(주)나그네들_g5hb87r8765rt68i7ur78',
        };

        dispatch(travelSliceActions.selectRegion(regionList));
      } else {
        // enroll 등 나머지 모드는 기존 방식
        let regionList = region.map((item) => cityViewList[country][cityIndex].title + ' ' + item);
        if (
          (country == 0 && cityViewList[country][cityIndex].id >= 3 && region[0] == '전체') ||
          (country == 0 && cityViewList[country][cityIndex].id == 1 && region[0] == '전체') ||
          (country != 0 && region[0] == '전체')
        ) {
          regionList = cityViewList[country][cityIndex].sub.map(
            (value, idx) => cityViewList[country][cityIndex].title + ' ' + value.subTitle,
          );
          regionList.shift();
        }
        if (country == 0 && cityIndex == 2) {
          regionList = [region[0] + ' 전체'];
        }
        if (country != 0) {
          regionList = regionList.map((item, idx) => {
            return `해외/${countryList[country].en}/${item
              .slice(
                item.indexOf(cityViewList[country][cityIndex].title) +
                cityViewList[country][cityIndex].title.length,
              )
              .trim()}`;
          });
        }

        const recentMode = useRecentModeStore.getState().recentMode;

        if(recentMode === 'current') {
          let copy = [...tendency];
          copy[3] = [...copy[3], ...copy[4]];
          copy.pop();
          copy.push(season);

          await patchRecentSelectList(copy);
          apiBody = {
            regionList,
            accomodationList: accommodations,
            selectList: copy,
            essentialPlaceList: essentialPlaces,
            timeLimitArray: timeLimitArray,
            nDay: nDay + 1,
            transit,
            distanceSensitivity: distance,
            bandwidth,
            freeTicket: true,
            version: 3,
            password: '(주)나그네들_g5hb87r8765rt68i7ur78',
          };
        } else {
          await patchRecentSelectList(tendency);
          apiBody = {
            regionList,
            accomodationList: accommodations,
            selectList: tendency,
            essentialPlaceList: essentialPlaces,
            timeLimitArray: timeLimitArray,
            nDay: nDay + 1,
            transit,
            distanceSensitivity: distance,
            bandwidth,
            freeTicket: true,
            version: 3,
            password: '(주)나그네들_g5hb87r8765rt68i7ur78',
          };
        }

        dispatch(travelSliceActions.selectRegion(regionList));
      }

      console.log(apiBody);

      const result = await dispatch(getTravelAi(apiBody)).unwrap();

      if (result) {
        dispatch(travelSliceActions.updateFiled({ field: 'tendency', value: tendency }));
        navigation.popToTop();
        navigation.navigate('/preset');
        !result.data.enoughPlace &&
        open(`해당 지역에 선택하신 성향의 \n 관광지가 부족하여,일정을 채우지 못했어요`, {
          icon: 'icon-warning-circle',
        });
      } else {
        open(`네트워크 연결이 불안정해요${`\n`}잠시후 시도해주세요`, {
          icon: 'icon-warning-circle',
        });
      }
    } catch (error) {
      console.log(error);
      open(`네트워크 연결이 불안정해요${`\n`}잠시후 시도해주세요`, {
        icon: 'icon-warning-circle',
      });
    } finally {
      setLoading(false);
    }
  }, [
    essentialPlaces,
    accommodations,
    region,
    country,
    cityIndex,
    tendency,
    season,
    travelName,
    nDay,
    transit,
    distance,
    bandwidth,
    timeLimitArray,
    dispatch,
    navigation,
    open,
    seasonList,
    tendencyList,
    countryList,
  ]);

  let tendency_34 = [...tendency[3], ...tendency[4]];
  console.log(tendency_34);

  return loading ? (
    <AnimateSkeleton delay={500} withGradient={true} withShimmer={true}>
      <Skeleton height={60} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
    </AnimateSkeleton>
  ) : (
    <FixedBottomCTAProvider>
      <NavigationBar />
      <View style={{ marginHorizontal: 0 }}>
        <Text
          typography="st8"
          fontWeight="bold"
          color={colors.grey700}
          style={{ alignSelf: 'center' }}
        >
          선택사항 확인
        </Text>
        <Border type="full" style={{ marginVertical: 16 }} />

        <View style={{ paddingHorizontal: 28, alignItems: 'flex-start', flexDirection: 'column', gap: 8, paddingVertical: 12}}>
          <Text typography="t7" fontWeight="medium" color={colors.grey700}>
            {day[0].format('YY.MM.DD') + ' - ' + day[nDay].format('YY.MM.DD')}
          </Text>

          <Text
            typography="t3"
            fontWeight="bold"
            color={colors.black}
          >
            {tendencyList[0]?.list[tendency[0].findIndex((item) => item == 1)]}
            {tendency[0].find((item) => item == 1) == undefined
              ? ''
              : tendency[0].findIndex((item) => item == 1) == 0 ||
              tendency[0].findIndex((item) => item == 1) == 4
                ? ' '
                : ' 함께하는 '}
            {seasonList[season.findIndex((item) => item == 1)].title} 여행
          </Text>
        </View>

        <Tab fluid defaultValue={'0'} size="large" onChange={setValue} style={{ marginTop: 8 }}>
          {['내 여행 성향', ...Array.from({ length: nDay + 1 }, (item, index) => index)].map(
            (item, idx) => {
              return (
                <Tab.Item value={String(idx)}>{idx == 0 ? '내 여행 성향' : `DAY ${idx}`}</Tab.Item>
              );
            },
          )}
        </Tab>
        <View style={{ paddingHorizontal: 24 }}>
          {value == '0' ? (
            <Stack.Vertical
              style={{
                position: 'relative',
                borderWidth: 1,
                borderColor: '#eeeeee',
                borderRadius: 13,
                paddingHorizontal: 24,
                paddingVertical: 20,
                marginTop: 10,
              }}
            >
              <Stack.Vertical gutter={21}>
                {tendency[0].find((item) => item == 1) && (
                  <Stack.Vertical>
                    <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(0, [0, 0])}>
                      <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                        여행메이트
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {tendency[0].map((item, inx) => {
                          return item ? (
                            <Badge size="medium" type="blue" badgeStyle="weak" key={inx}>
                              {tendencyList[0]?.list[inx]}
                            </Badge>
                          ) : null;
                        })}
                      </View>
                    </TouchableOpacity>
                  </Stack.Vertical>
                )}
                <Stack.Vertical>
                  <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(1, [1, 1])}>
                    <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                      이동 수단
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <Badge size="medium" type="blue" badgeStyle="weak" key={transit}>
                        {moveList_transit[transit]?.name}
                      </Badge>
                    </View>
                  </TouchableOpacity>
                </Stack.Vertical>
                <Stack.Vertical>
                  <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(2, [2, 2])}>
                    <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                      여행 유형
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <Badge size="medium" type="blue" badgeStyle="weak" key={Number(bandwidth)}>
                        {moveList_busy[Number(bandwidth)]?.name}
                      </Badge>
                    </View>
                  </TouchableOpacity>
                </Stack.Vertical>
                {tendency[1].find((item) => item == 1) && (
                  <Stack.Vertical>
                    <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(3, [3, 3])}>
                      <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                        여행테마
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {tendency[1].map((item, inx) => {
                          return item ? (
                            <Badge size="medium" type="blue" badgeStyle="weak" key={inx}>
                              {tendencyList[1]?.list[inx]}
                            </Badge>
                          ) : null;
                        })}
                      </View>
                    </TouchableOpacity>
                  </Stack.Vertical>
                )}
                {tendency[2].find((item) => item == 1) && (
                  <Stack.Vertical>
                    <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(4, [4, 4])}>
                      <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                        이런 걸 하고 싶어요
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {tendency[2].map((item, inx) => {
                          return item ? (
                            <Badge size="medium" type="blue" badgeStyle="weak" key={inx}>
                              {tendencyList[2]?.list[inx]}
                            </Badge>
                          ) : null;
                        })}
                      </View>
                    </TouchableOpacity>
                  </Stack.Vertical>
                )}
                {tendency_34.find((item) => item == 1) && (
                  <Stack.Vertical>
                    <TouchableOpacity
                      style={{
                        width: '100%',
                        paddingVertical: 8,
                      }}
                      onPress={() => showHourBottomSheet(5, [5, 5])}
                      activeOpacity={0.8}
                    >
                      <Text typography="t5" fontWeight="medium" color={colors.grey800} style={{ marginBottom: 8 }}>
                        이런 곳에 가고 싶어요
                      </Text>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {tendency_34.map((item, inx) => {
                          let badgeLabel = '';
                          if (inx < 6) {
                            badgeLabel = tendencyList[3]?.list[inx];
                          } else {
                            badgeLabel = tendencyList[4]?.list[inx - 6];
                          }
                          if (!item || !badgeLabel || badgeLabel.length === 0) return null;

                          return (
                            <View key={inx} style={{ marginRight: 8, marginBottom: 8 }}>
                              <Badge size="medium" type="blue" badgeStyle="weak">
                                {badgeLabel}
                              </Badge>
                            </View>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  </Stack.Vertical>
                )}
                <Stack.Vertical>
                  <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(6, [6, 6])}>
                    <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                      여행지 인기도
                    </Text>
                    <Badge size="medium" type="blue" badgeStyle="weak">
                      {popular}
                    </Badge>
                  </TouchableOpacity>
                </Stack.Vertical>
                <Stack.Vertical gutter={13}>
                  <TouchableOpacity style={{gap: 13}} onPress={() => showHourBottomSheet(7, [7, 7])}>
                    <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                      위치 반경
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <Badge size="medium" type="blue" badgeStyle="weak" key={distance}>
                        {distance_list[distance]}
                      </Badge>
                    </View>
                  </TouchableOpacity>
                </Stack.Vertical>
              </Stack.Vertical>
            </Stack.Vertical>
          ) : (
            (() => {
              const filteredPlaces = essentialPlaces.filter((place) => place.day === Number(value));
              return (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginHorizontal: 24,
                      marginTop: 20,
                    }}
                  >
                    <Text typography="t5" fontWeight="semibold" color={colors.grey700}>
                      {'DAY' + value}
                    </Text>
                    <Text typography="t6" fontWeight="regular" color="#6B7684">
                      {day[Number(value) - 1].format('YY.MM.DD') +
                        ' (' +
                        weekdays[day[Number(value) - 1].days()] +
                        ')'}
                    </Text>
                  </View>

                  {filteredPlaces.map((data, index) => {
                    const refKey = `${index}_key`;
                    return (
                      <ListRow
                        key={refKey}
                        contents={
                          <ListRow.Texts
                            type="1RowTypeA"
                            top={data?.name}
                            topProps={{
                              typography: 't5',
                              fontWeight: 'semibold',
                              color: colors.grey800,
                            }}
                          />
                        }
                        right={
                          <Badge size="small" type={'green'} badgeStyle="weak" fontWeight="bold">
                            {'여행지'}
                          </Badge>
                        }
                      />
                    );
                  })}
                  {accommodations[Number(value)].name && (
                    <ListRow
                      contents={
                        <ListRow.Texts
                          type="1RowTypeA"
                          top={accommodations[Number(value)].name}
                          topProps={{
                            typography: 't5',
                            fontWeight: 'semibold',
                            color: colors.grey800,
                          }}
                        />
                      }
                      right={
                        <Badge size="small" type={'red'} badgeStyle="weak" fontWeight="bold">
                          {'숙소'}
                        </Badge>
                      }
                    />
                  )}
                  <ListRow
                    onPress={() => {
                      if (accommodations[Number(value)]?.name != '' && filteredPlaces.length == 3) {
                        open('숙소는 1개, 여행지는 3개까지 추가 할 수 있어요.', {
                          icon: 'icon-warning-circle',
                        });
                      } else {
                        navigation.navigate('/enroll/essential-search', {
                          idx: Number(value) - 1,
                        });
                      }
                    }}
                    left={
                      <ListRow.Icon
                        name="icon-plus-mono"
                        style={{
                          backgroundColor: colors.grey100,
                        }}
                        color={colors.blue500}
                        type="border"
                      />
                    }
                    right={<ListRow.Icon name="icon-arrow-right-mono" color={colors.grey400} />}
                    contents={
                      <ListRow.Texts
                        type="1RowTypeA"
                        top={'추가하기'}
                        topProps={{
                          typography: 't5',
                          fontWeight: 'medium',
                          color: colors.grey800,
                        }}
                      />
                    }
                  />
                </>
              );
            })()
          )}
          <FixedBottomCTA
            onPress={() => {
              goNext();
            }}
          >
            추천 일정 조회하기
          </FixedBottomCTA>
        </View>
      </View>
    </FixedBottomCTAProvider>
  );
}

type ModifyBottomSheetContentProps = {
  startIndex: number;
  onCancel: () => void;
  allowedSteps?: number[];
};

function ModifyBottomSheetContent({
                                    startIndex,
                                    onCancel,
                                    allowedSteps,
                                  }: ModifyBottomSheetContentProps) {
  // 전체 네비게이션 스택
  const navigationStack = [
    { title: 'who', component: <EnrollWho marginTop={0} contentRatio={0.8} /> },
    { title: 'transit', component: <EnrollTransit marginTop={0} /> },
    { title: 'busy', component: <EnrollBusy marginTop={0} /> },
    { title: 'concept', component: <EnrollConcept marginTop={0} /> },
    { title: 'play', component: <EnrollPlay marginTop={0} /> },
    { title: 'tour', component: <EnrollTour marginTop={0} /> },
    { title: 'popular', component: <EnrollPopular contentRatio={0.8} /> },
    { title: 'distance', component: <EnrollDistance contentRatio={0.88} /> },
  ];

  // 실제 이동 가능한 인덱스 배열, 없으면 전체 사용
  const stepSequence =
    allowedSteps && allowedSteps.length > 0 ? allowedSteps : navigationStack.map((_, idx) => idx);

  // step은 stepSequence의 인덱스
  const [step, setStep] = useState(Math.max(0, stepSequence.indexOf(startIndex)));

  const currentStackIndex = stepSequence[step];
  const textData = routeStack['/' + navigationStack[currentStackIndex]?.title];

  return (
    <View>
      <StepText title={textData?.title} subTitle2={textData?.subTitle2} />
      {navigationStack[currentStackIndex]?.component}

      <BottomSheet.CTA.Double
        containerStyle={{ backgroundColor: 'white' }}
        leftButton={
          <Button
            type="dark"
            style="weak"
            display="block"
            onPress={() => setStep(step - 1)}
            disabled={step === 0}
          >
            이전으로
          </Button>
        }
        rightButton={
          <Button
            display="block"
            onPress={() => {
              if (step === stepSequence.length - 1) {
                onCancel();
              } else {
                setStep(step + 1);
              }
            }}
          >
            {step === stepSequence.length - 1 ? '완료' : '다음으로'}
          </Button>
        }
      />
    </View>
  );
}

export default FinalCheck;