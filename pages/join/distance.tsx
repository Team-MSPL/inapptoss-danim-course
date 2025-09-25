import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import {
  FixedBottomCTAProvider,
  Button,
  FixedBottomCTA,
  Text,
  colors,
  Icon,
  Slider,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import CustomMapView from '../../components/map-view';
import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions } from '../../redux/regionSearchSlice';
import { getCurrentLocation, Accuracy, Location } from '@apps-in-toss/framework';

export const Route = createRoute('/join/distance', {
  validateParams: (params) => params,
  component: JoinDistance,
});

const ZOOM_STEP = 0.275;
function getZoomByValue(value: number) {
  return 12.5 - (value - 1) * ZOOM_STEP;
}

const SEOUL_CITY_HALL = { latitude: 37.5665, longitude: 126.978 };

export default function JoinDistance() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const request = useAppSelector((state) => state.regionSearchSlice.request);

  const [range, setRange] = useState(
    request.distanceSensitivity > 0 ? request.distanceSensitivity : 5,
  );
  const [searchValue, setSearchValue] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 권한 상태 확인
  const checkPermission = async () => {
    try {
      const status = await getCurrentLocation.getPermission?.();
      setPermissionStatus(status ?? 'unknown');
      Alert.alert('위치 권한 상태', String(status));
    } catch (e) {
      setPermissionStatus('error');
      Alert.alert('권한 확인 실패', String(e));
    }
  };

  // 권한 다이얼로그 요청
  const requestPermission = async () => {
    setPermissionRequested(true);
    try {
      const result = await getCurrentLocation.openPermissionDialog?.();
      if (result === true) {
        Alert.alert('위치 권한이 허용되었습니다.');
      } else {
        Alert.alert('위치 권한이 거부되었습니다.');
      }
    } catch (e) {
      Alert.alert('권한 요청 실패', String(e));
    }
  };

  // 위치 요청
  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCurrentLocation({ accuracy: Accuracy.Balanced });
      setLocation(response);
    } catch (e: any) {
      setError(e?.message || '위치 정보를 가져오지 못했습니다.');
      setLocation(null);
    }
    setLoading(false);
  };

  // 지도 중심 좌표
  let lat = SEOUL_CITY_HALL.latitude;
  let lng = SEOUL_CITY_HALL.longitude;
  if (location?.coords) {
    lat = location.coords.latitude;
    lng = location.coords.longitude;
  }

  // 슬라이더 놓을 때에만 리덕스 업데이트
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

  // 렌더링 분기
  if (!permissionRequested) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginBottom: 16 }}>여행 반경 추천을 위해 위치 권한이 필요합니다.</Text>
        <Button type="primary" onPress={requestPermission}>
          위치 권한 요청하기
        </Button>
        <View style={{ height: 12 }} />
        <Button type="dark" style="weak" onPress={checkPermission}>
          권한 상태 확인
        </Button>
        <Text style={{ marginTop: 16, color: colors.grey400 }}>
          권한 거부 시 서울시청을 기준으로 보여집니다.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>위치를 불러오는 중입니다...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginBottom: 8 }}>{error}</Text>
        <Button style="weak" type="dark" onPress={fetchLocation}>
          위치 다시 시도
        </Button>
        <Text style={{ marginTop: 16, color: colors.grey400 }}>
          계속 안된다면 위치 권한을 확인해 주세요. {'\n'}
          서울시청을 기준으로 지도를 표시합니다.
        </Text>
      </View>
    );
  }

  // 정상 위치 or fallback
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        {/* Step Header */}
        <View style={{ marginHorizontal: 24, marginTop: 16, marginBottom: 0 }}>
          <Text typography="t6" color={colors.grey600} style={{ marginBottom: 6 }}>
            3. 원하는 반경의 지역을 추천해드려요
          </Text>
          <Text typography="t2" fontWeight="bold" style={{ marginBottom: 8 }}>
            현재 위치에서 추천받을 여행 반경을 선택해주세요
          </Text>
          <Text typography="t7" color={colors.grey500} style={{ marginBottom: 16 }}>
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
            zoom={getZoomByValue(range)}
            range={range}
            style={styles.mapView}
            contentRatio={1}
          />
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
            <Text typography="t5" fontWeight="medium" color={colors.grey700}>
              내 근처
            </Text>
            <Text typography="t5" fontWeight="medium" color={colors.grey700}>
              한국 전체
            </Text>
          </View>
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
              onPress={() => navigation.navigate('/join/confirm')}
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
