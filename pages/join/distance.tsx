import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { getCurrentLocation, Accuracy } from '@apps-in-toss/framework';
import { FixedBottomCTAProvider, FixedBottomCTA, colors, Icon, Slider, Button } from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import CustomMapView from '../../components/map-view';
import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions } from '../../redux/regionSearchSlice';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import type { GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import {StepText} from "../../components/step-text";

export const Route = createRoute('/join/distance', {
  validateParams: (params) => params,
  component: JoinDistance,
});

const KOREA_CENTER = { latitude: 36.5, longitude: 127.8 };
const INPUT_WIDTH = Math.min(340, Dimensions.get('window').width - 36);

function getRadiusByRange(range: number) {
  const map = [1000, 3000, 10000, 20000, 50000, 100000, 150000, 200000, 300000, 500000];
  // @ts-ignore
  return map[range - 1] * 0.00057;
}
function getZoomByRange(range: number) {
  const map = [14, 13, 11.5, 10.5, 9, 8, 7.5, 7, 6.5, 6];
  return (map[range - 1] ?? 14) * 0.9;
}

export default function JoinDistance() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const request = useAppSelector((state) => state.regionSearchSlice.request);
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);

  const [range, setRange] = useState(
    request.distanceSensitivity > 0 ? request.distanceSensitivity : 5,
  );
  const [location, setLocation] = useState<any>(null); // 내 위치
  const [selectedLocation, setSelectedLocation] = useState<null | { lat: number; lng: number; name?: string }>(null); // 검색 선택 지역
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 위치 권한 요청 및 위치 요청
  const requestLocationAndFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const granted = await getCurrentLocation.openPermissionDialog?.();
      if (granted) {
        const loc = await getCurrentLocation({ accuracy: Accuracy.Balanced });
        setLocation(loc);
      }
    } catch (e: any) {
      setError(e?.message || '위치 정보를 가져오지 못했습니다.');
    }
    setLoading(false);
  };

  // 최초 마운트 시 위치 요청
  useEffect(() => {
    requestLocationAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지도 중심 좌표 계산
  let lat: number, lng: number;
  if (range <= 5 && selectedLocation) {
    lat = selectedLocation.lat;
    lng = selectedLocation.lng;
  } else if (range <= 5 && location?.coords) {
    lat = location.coords.latitude;
    lng = location.coords.longitude;
  } else {
    lat = KOREA_CENTER.latitude;
    lng = KOREA_CENTER.longitude;
  }

  // 슬라이더 변경 완료시 리덕스 업데이트
  const handleRangeChangeEnd = (value: number) => {
    dispatch(
      regionSearchActions.setRequest({
        ...request,
        distanceSensitivity: value,
        recentPosition: {
          lat,
          lng,
        },
      }),
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        {/* Step Header */}
        <StepText
          title={'현재 위치에서 추천받을 여행 반경\n을 선택해주세요'}
          subTitle1={'3. 원하는 반경의 지역을 추천해드려요'}
          subTitle2={'그림은 이해를 돕기 위한 예시이므로 실제 결과와는 \n차이가 있을 수 있어요.'}
        />
        <View style={{ marginHorizontal: 24, marginBottom: 0 }}>
          {/* 검색/다른 위치 입력창 */}
          <View style={styles.searchBox}>
            <GooglePlacesAutocomplete
              placeholder="지역을 검색해보세요"
              disableScroll={false}
              enablePoweredByContainer={false}
              keepResultsAfterBlur={true}
              ref={autocompleteRef}
              query={{
                key: import.meta.env.GOOGLE_API_KEY,
                language: 'ko',
              }}
              textInputProps={{
                placeholderTextColor: colors.grey500,
                allowFontScaling: false,
              }}
              renderLeftButton={() => <Icon name="icon-search-mono" />}
              styles={{
                container: { alignItems: 'center' },
                textInputContainer: {
                  width: INPUT_WIDTH,
                  height: 28,
                  borderRadius: 12,
                  backgroundColor: colors.grey100,
                  alignItems: 'center',
                  paddingLeft: 20,
                },
                listView: { width: INPUT_WIDTH, maxHeight: 250, zIndex: 1000 },
                textInput: {
                  position: 'relative',
                  top: 2,
                  color: colors.grey500,
                  backgroundColor: 'transparent',
                  fontSize: 15,
                  height: 28,
                  lineHeight: 20,
                  alignSelf: 'center',
                  paddingVertical: 0,
                  textAlignVertical: 'center',
                  paddingTop: 0,
                  paddingBottom: 0,
                },
                description: { color: 'black' },
              }}
              fetchDetails={true}
              onPress={async (data, details) => {
                if (details?.geometry?.location) {
                  setSelectedLocation({
                    lat: details.geometry.location.lat,
                    lng: details.geometry.location.lng,
                    name: details.name,
                  });
                }
              }}
              onFail={(error) => console.log(error)}
              onNotFound={() => console.log('no results')}
            />
          </View>
        </View>

        {/* 지도 */}
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <CustomMapView
            lat={lat}
            lng={lng}
            zoom={getZoomByRange(range)}
            range={getRadiusByRange(range)}
            style={styles.mapView}
            contentRatio={1}
          />
        </View>

        {/* 로딩/에러/위치 권한 안내 메시지 */}
        <View style={{ alignItems: 'center', marginTop: 10, minHeight: 28 }}>
          {loading && <Text>위치를 불러오는 중입니다...</Text>}
          {!loading && error && (
            <Text style={{ color: 'red', marginBottom: 4 }}>{error}</Text>
          )}
          {!loading && !location && !selectedLocation && (
            <Text style={{ color: colors.grey400 }}>
              위치 권한이 없으면 대한민국 중심을 기준으로 보여집니다.
            </Text>
          )}
        </View>

        {/* 슬라이더 */}
        <View style={{ marginHorizontal: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: 15, color: colors.grey700 }}>내 근처/선택지역</Text>
            <Text style={{ fontSize: 15, color: colors.grey700 }}>한국 전체</Text>
          </View>
          <Slider
            value={range}
            onChange={setRange}
            onChangeEnd={handleRangeChangeEnd}
            min={1}
            max={10}
            step={1}
            color={colors.green300}
          />
        </View>
        {/* 하단 버튼 */}
        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white' }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={() => navigation.goBack()}>
              이전으로
            </Button>
          }
          rightButton={
            <Button
              display="block"
              type="primary"
              onPress={() => navigation.navigate('/join/loading')}
            >
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey100,
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 10,
    marginVertical: 12,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 15,
    flex: 1,
    color: colors.grey700,
  },
  mapView: {
    width: 340,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
});