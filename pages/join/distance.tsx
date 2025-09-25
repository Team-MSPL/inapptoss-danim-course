import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
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
import { BedrockRoute, useNavigation } from 'react-native-bedrock';
import CustomMapView from '../../components/map-view';
import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions } from '../../redux/regionSearchSlice';

export const Route = BedrockRoute('/join/distance', {
  validateParams: (params) => params,
  component: JoinDistance,
});

const ZOOM_STEP = 0.275;
function getZoomByValue(value: number) {
  return 12.5 - (value - 1) * ZOOM_STEP;
}

const SEOUL_CITY_HALL = { latitude: 37.5665, longitude: 126.9780 };

export default function JoinDistance() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const request = useAppSelector(state => state.regionSearchSlice.request);

  // 슬라이더 값은 local state로만 관리
  const [range, setRange] = useState(request.distanceSensitivity > 0 ? request.distanceSensitivity : 5);
  const [searchValue, setSearchValue] = useState('');

  // 지도는 항상 서울시청 중심
  const lat = SEOUL_CITY_HALL.latitude;
  const lng = SEOUL_CITY_HALL.longitude;

  const handleRangeChangeEnd = (value: number) => {
    dispatch(regionSearchActions.setRequest({
      ...request,
      distanceSensitivity: value,
      recentPosition: {
        lat: SEOUL_CITY_HALL.latitude,
        lng: SEOUL_CITY_HALL.longitude,
      },
    }));
  };

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
            onChange={setRange} // local state만 변경
            onChangeEnd={handleRangeChangeEnd} // 손을 뗄 때만 redux 업데이트
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
            <Button display="block" type="primary" onPress={() => navigation.navigate('/join/confirm')}>
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
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