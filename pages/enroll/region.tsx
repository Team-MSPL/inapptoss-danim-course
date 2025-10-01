import {
  Border,
  colors,
  FixedBottomCTAProvider,
  SearchField,
  Text,
} from '@toss-design-system/react-native';
import React, { useCallback, useRef, useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import { CustomProgressBar } from '../../components/progress-bar';
import { StepText } from '../../components/step-text';
import { styles } from './country';
import TendencyButton from '../../components/tendency-button';
import { RouteButton } from '../../components/route-button';
import { cityViewList } from '../../utill/city-list';
import { useAppDispatch, useAppSelector } from 'store';
import { ScrollView, TouchableOpacity } from '@granite-js/native/react-native-gesture-handler';
import { travelSliceActions } from '../../redux/travle-slice';
import { Pressable, View, TextInput } from 'react-native';
import { CustomColor } from '../../utill/custom-color';

export const Route = createRoute('/enroll/region', {
  validateParams: (params) => params,
  component: Region,
});

export function Region() {
  const dispatch = useAppDispatch();
  const { country, cityIndex, region, cityDistance } = useAppSelector((state) => state.travelSlice);

  const filterList = ['도심권', '동남권', '동북권', '서남권', '서북권'];
  const checkList = ['서울', '제주'];

  const selectPopularity = (e: { id: number; subTitle: string; subId: number }) => {
    // 업데이트될 값 콘솔 출력
    const nextRegion = checkList.includes(e.subTitle) ? ['전체'] : [e.subTitle];
    const nextCityIndex = e.id;
    const nextCityDistance = [e.subId];
    console.log('[selectPopularity] nextRegion:', nextRegion, 'nextCityIndex:', nextCityIndex, 'nextCityDistance:', nextCityDistance);

    dispatch(
      travelSliceActions.selectPopularity({
        region: nextRegion,
        cityIndex: nextCityIndex,
        cityDistance: nextCityDistance,
      }),
    );
  };

  const selectRegion = (e: any) => {
    let nextRegion: string[] = [];
    let nextCityDistance: number[] = [];

    if (e.subTitle === '전체' || region.includes('전체')) {
      nextRegion = [e.subTitle];
      nextCityDistance = [e.id];
    } else if (region.includes(e.subTitle)) {
      nextRegion = region.filter((item) => item !== e.subTitle);
      nextCityDistance = cityDistance.filter((item) => item !== e.id);
    } else {
      if (!(country == 0 && cityIndex == 2)) {
        nextRegion = [...region];
        nextCityDistance = [...cityDistance];
      }
      nextRegion.push(e.subTitle);
      nextCityDistance.push(e.id);
    }
    console.log('[selectRegion] nextRegion:', nextRegion, 'cityIndex:', cityIndex, 'nextCityDistance:', nextCityDistance);

    dispatch(
      travelSliceActions.firstSelectRegion({
        region: nextRegion,
        cityDistance: nextCityDistance,
      }),
    );
  };

  const handleRegionSerarch = (e: string) => {
    return cityViewList[country]
      .map((item, index) => {
        if (index != 0) {
          return item.sub.map((value, idx) => {
            if (value.subTitle == '전체') {
              let copy = { ...value, subTitle: item.title };
              return copy;
            } else {
              return value;
            }
          });
        }
      })
      .filter((item) => item != undefined)
      .reduce(function (acc, cur) {
        return [...acc, ...cur];
      })
      ?.filter((item) => !filterList.includes(item?.subTitle))
      .filter((item, index) => item.subTitle.includes(e));
  };

  const [value, setValue] = useState('');
  const [regionText, setRegionText] = useState('');
  const [regionSearchState, setRegionSearchState] = useState(false);
  const regionSearchRef = useRef<TextInput | null>(null);
  const [regionMatchList, setRegionMatchList] = useState<
    { id: number; lat: number; lng: number; subTitle: string }[]
  >([]);
  const handleRegionText = useCallback((e: string) => {
    setValue(e);
    setRegionMatchList(handleRegionSerarch(e));
  }, []);

  const selectCity = (e: number) => {
    // cityIndex가 바뀔 때 콘솔 출력 & region 초기화
    if (region) {
      console.log('[selectCity] region 초기화됨 (cityIndex 변경)', []);
      dispatch(travelSliceActions.updateFiled({ field: 'region', value: [] }));
    }
    console.log('[selectCity] cityIndex:', e);
    dispatch(travelSliceActions.updateFiled({ field: 'cityIndex', value: e }));
  };

  return (
    <>
      <SearchField
        hasClearButton
        placeholder="지역을 검색해보세요"
        style={{ marginHorizontal: 24, marginBottom: 24 }}
        value={value}
        onChange={(e) => {
          setRegionSearchState(
            e.nativeEvent.text.length == 0 && regionText.length >= 1 ? false : true,
          );
          handleRegionText(e.nativeEvent.text);
        }}
      />
      <View style={{ marginHorizontal: 24 }}>
        <ScrollView style={{ zIndex: 2 }}>
          {regionSearchState &&
            value != '' &&
            regionMatchList.map((item, index) => {
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    const isPopular = cityViewList[country].filter((asd) => asd.title == item.subTitle)[0]?.id ? true : false;
                    const regionVal = isPopular ? ['전체'] : [item.subTitle];
                    const cityIndexVal =
                      cityViewList[country]
                        .slice(1)
                        .filter(
                          (asd) =>
                            asd.sub.filter((qqq) => qqq.subTitle == item.subTitle).length >= 1,
                        )[0]?.id ??
                      cityViewList[country].filter((asd) => asd.title == item.subTitle)[0]?.id;
                    const cityDistanceVal = [item.id];
                    console.log('[searchResult] nextRegion:', regionVal, 'cityIndex:', cityIndexVal, 'cityDistance:', cityDistanceVal);

                    dispatch(
                      travelSliceActions.selectPopularity({
                        region: regionVal,
                        cityIndex: cityIndexVal,
                        cityDistance: cityDistanceVal,
                      }),
                    );
                    regionSearchRef.current?.blur();
                    setRegionText(item.subTitle);
                    setRegionSearchState(false);
                  }}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.grey400,
                  }}
                >
                  <Text>{item.subTitle}</Text>
                </Pressable>
              );
            })}
        </ScrollView>
      </View>

      {/* 하단 버튼(서울, 부산 등) */}
      <ScrollView
        horizontal={true}
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: 24 }}
      >
        {cityViewList[country].map((item, idx) => {
          return (
            <TouchableOpacity
              key={idx}
              style={{
                paddingHorizontal: 18, // 18로 변경됨
                paddingVertical: 8,
                backgroundColor: cityIndex == idx ? CustomColor.primary : '#FAFAFB',
                borderRadius: 14,
                minWidth: 60,
                minHeight: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: cityViewList[country].length - 1 == idx ? 32 : 8,
                flexDirection: 'row',
              }}
              onPress={() => {
                selectCity(item.id);
              }}
            >
              <Text
                typography="t5"
                fontWeight={cityIndex == idx ? 'semibold' : 'regular'}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  textAlign: 'center',
                  lineHeight: 22,
                  color: '#505A69',
                  includeFontPadding: false,
                }}
              >
                {item?.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Border type="full" style={{ marginVertical: 16 }} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 24,
        }}
      >
        {cityIndex != null &&
          cityViewList[country][cityIndex].sub?.map((item, idx) => {
            return (
              <TouchableOpacity
                key={idx}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  backgroundColor: region.includes(item.subTitle)
                    ? 'rgba(202, 251, 7,0.2)'
                    : '#FAFAFB',
                  borderWidth: region.includes(item.subTitle) ? 0.5 : 0,
                  borderColor: CustomColor.primary,
                  borderRadius: 14,
                  minWidth: 60,
                  minHeight: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  marginBottom: 8,
                  flexDirection: 'row',
                }}
                onPress={() => {
                  cityIndex == 0 ? selectPopularity(item) : selectRegion(item);
                }}
              >
                <Text
                  typography="t5"
                  fontWeight={region.includes(item.subTitle) ? 'semibold' : 'regular'}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    textAlign: 'center',
                    lineHeight: 22,
                    color: '#505A69', // 색상 변경
                    includeFontPadding: false,
                  }}
                >
                  {item?.subTitle}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
      {country == 0 && cityIndex == 1 && (
        <View
          style={{
            marginHorizontal: 24,
            borderRadius: 20,
            borderColor: '#FAFAFB',
            borderWidth: 1,
            paddingHorizontal: 24,
            paddingVertical: 20,
            gap: 10,
          }}
        >
          {cityViewList[country][1].sub.map((item, idx) => {
            return idx != 0 ? (
              <View key={idx} style={{ flexDirection: 'row' }}>
                <View style={{ width: 94 }}>
                  <Text typography="t7" fontWeight="regular" color={colors.grey600}>
                    {item.subTitle}
                  </Text>
                </View>
                <View style={{ width: 164 }}>
                  <Text typography="t7" fontWeight="regular" color={colors.grey400}>
                    {item?.example}
                  </Text>
                </View>
              </View>
            ) : null;
          })}
        </View>
      )}
    </>
  );
}