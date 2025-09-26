import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Button, TextInput } from 'react-native';
import { getCurrentLocation, Accuracy } from '@apps-in-toss/framework';
import { FixedBottomCTAProvider, FixedBottomCTA, colors, Icon, Slider } from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import CustomMapView from '../../components/map-view';
import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions } from '../../redux/regionSearchSlice';
import { createRoute, useNavigation } from '@granite-js/react-native';

export const Route = createRoute('/join/distance', {
  validateParams: (params) => params,
  component: JoinDistance,
});

const KOREA_CENTER = { latitude: 36.5, longitude: 127.8 };
const SEOUL_CITY_HALL = { latitude: 37.5665, longitude: 126.978 };

function getRadiusByRange(range: number) {
  const map = [1000, 3000, 10000, 20000, 50000, 100000, 150000, 200000, 300000, 500000];
  // @ts-ignore
  return map[range - 1] * 0.00057; // 사용자가 지정한 비율 유지
}
function getZoomByRange(range: number) {
  const map = [14, 13, 11.5, 10.5, 9, 8, 7.5, 7, 6.5, 6];
  return (map[range - 1] ?? 14) * 0.9;
}

export default function JoinDistance() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const request = useAppSelector((state) => state.regionSearchSlice.request);

  const [range, setRange] = useState(
    request.distanceSensitivity > 0 ? request.distanceSensitivity : 5,
  );
  const [searchValue, setSearchValue] = useState('');
  const [location, setLocation] = useState<any>(null);
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
      // 권한 거부 시 아무것도 하지 않음, 계속 default 중심
    } catch (e: any) {
      setError(e?.message || '위치 정보를 가져오지 못했습니다.');
    }
    setLoading(false);
  };

  // 최초 마운트 시 위치 요청 시도
  useEffect(() => {
    requestLocationAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  let lat: number, lng: number;
  if (range <= 6 && location?.coords) {
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
        <View style={{ marginHorizontal: 24, marginTop: 16, marginBottom: 0 }}>
          <Text style={{ fontSize: 16, color: colors.grey600, marginBottom: 6 }}>
            3. 원하는 반경의 지역을 추천해드려요
          </Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            현재 위치에서 추천받을 여행 반경을 선택해주세요
          </Text>
          <Text style={{ fontSize: 13, color: colors.grey500, marginBottom: 16 }}>
            그림은 이해를 돕기 위한 예시이므로 실제 결과와는 차이가 있을 수 있어요.
          </Text>
          {/* 검색/다른 위치 입력창 */}
          <View style={styles.searchBox}>
            <Icon name="icon-search-mono" color={colors.grey400} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="다른 위치를 원하시면 검색해 주세요"
              value={searchValue}
              onChangeText={setSearchValue}
              placeholderTextColor={colors.grey400}
              editable={false}
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
          {!loading && !location && (
            <Text style={{ color: colors.grey400 }}>
              위치 권한이 없으면 서울시청을 기준으로 보여집니다.
            </Text>
          )}
        </View>

        {/* 슬라이더 */}
        <View style={{ marginHorizontal: 32, marginTop: 24 }}>
          <Slider
            value={range}
            onChange={setRange}
            onChangeEnd={handleRangeChangeEnd}
            min={1}
            max={10}
            step={1}
            color={colors.green300}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: 15, color: colors.grey700 }}>내 근처</Text>
            <Text style={{ fontSize: 15, color: colors.grey700 }}>한국 전체</Text>
          </View>
        </View>
        {/* 하단 버튼 */}
        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white' }}
          leftButton={
            <Button title="이전으로" color={colors.grey700} onPress={() => navigation.goBack()} />
          }
          rightButton={
            <Button title="다음으로" color={colors.green300} onPress={() => navigation.navigate('/join/confirm')} />
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
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