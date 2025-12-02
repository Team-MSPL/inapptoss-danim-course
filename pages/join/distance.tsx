import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { getCurrentLocation, Accuracy } from '@apps-in-toss/framework';
import {
  FixedBottomCTAProvider,
  FixedBottomCTA,
  colors,
  Icon,
  Slider,
  Button,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import CustomMapView from '../../components/map-view';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import type { GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { StepText } from '../../components/step-text';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import { CustomProgressBarJoin } from '../../components/join/custom-progress-bar-join';
import { useCountryStore } from '../../zustand/countryStore';

export const Route = createRoute('/join/distance', {
  validateParams: (params) => params,
  component: JoinDistance,
});

const KOREA_CENTER = { latitude: 36.5, longitude: 127.8 };
const INPUT_WIDTH = Math.min(340, Dimensions.get('window').width - 36);

/**
 * Base radius table (meters) for slider steps 1..10.
 */
const BASE_RADIUS_METERS = [
  50_000, 100_000, 150_000, 200_000, 250_000,
  300_000, 350_000, 400_000, 450_000, 500_000,
];

/**
 * Country centroid map (approximate "central" point of country) in Korean keys.
 */
const COUNTRY_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  한국: { latitude: 36.5, longitude: 127.8 },
  일본: { latitude: 36.204824, longitude: 138.252924 },
  중국: { latitude: 35.861660, longitude: 104.195397 },
  베트남: { latitude: 14.058324, longitude: 108.277199 },
  태국: { latitude: 15.870032, longitude: 100.992541 },
  필리핀: { latitude: 12.879721, longitude: 121.774017 },
  싱가포르: { latitude: 1.352083, longitude: 103.819839 },
  '홍콩과 마카오': { latitude: 22.3193039, longitude: 114.1693611 },
};

/**
 * Country scale factors to reflect relative country "size" for map radius / zoom.
 * Increased 일본 scale so the maximum slider includes farther 북부(예: 삿포로)까지 보이도록 조정했습니다.
 */
const COUNTRY_SCALE: Record<string, number> = {
  한국: 1.0,
  일본: 3.0, // 조정: 기존 1.4 -> 3.0 (더 넓게 보여주기 위해)
  중국: 6.0,
  베트남: 2.2,
  태국: 1.8,
  필리핀: 2.5,
  싱가포르: 0.6,
  '홍콩과 마카오': 0.5,
};

function getRadiusByRangeAndScale(range: number, countryScale: number) {
  const idx = Math.max(0, Math.min(BASE_RADIUS_METERS.length - 1, range - 1));
  const meters = BASE_RADIUS_METERS[idx] * countryScale;
  const mapUnit = meters * 0.00057;
  return mapUnit;
}

function getZoomByRangeAndScale(range: number, countryScale: number) {
  const idx = Math.max(0, Math.min(BASE_RADIUS_METERS.length - 1, range - 1));
  const meters = BASE_RADIUS_METERS[idx] * countryScale;
  const km = Math.max(1, meters / 1000);
  const zoom = Math.max(2, 13 - Math.log2(km));
  return zoom;
}

export default function JoinDistance() {
  const navigation = useNavigation();
  const distanceSensitivity = useRegionSearchStore((state) => state.distanceSensitivity);
  const setDistanceSensitivity = useRegionSearchStore((state) => state.setDistanceSensitivity);
  const recentPosition = useRegionSearchStore((state) => state.recentPosition);
  const setRecentPosition = useRegionSearchStore((state) => state.setRecentPosition);

  const selectedCountryKo = useCountryStore((s) => s.selectedCountryKo);

  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);

  const [range, setRange] = useState(distanceSensitivity > 0 ? distanceSensitivity : 5);
  const [location, setLocation] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<null | { lat: number; lng: number; name?: string }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    requestLocationAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countryScale = (() => {
    if (!selectedCountryKo) return COUNTRY_SCALE['한국'] ?? 1.0;
    return COUNTRY_SCALE[selectedCountryKo] ?? COUNTRY_SCALE['한국'] ?? 1.0;
  })();

  const center = useMemo(() => {
    if (selectedLocation) {
      return { latitude: selectedLocation.lat, longitude: selectedLocation.lng };
    }

    if (selectedCountryKo && COUNTRY_CENTERS[selectedCountryKo]) {
      return COUNTRY_CENTERS[selectedCountryKo];
    }

    if (location?.coords) {
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    }

    return KOREA_CENTER;
  }, [selectedLocation, selectedCountryKo, location]);

  const handleRangeChange = (value: number) => {
    setRange(value);
    setDistanceSensitivity(value);
    setRecentPosition({ lat: center.latitude, lng: center.longitude });
  };

  const handlePlaceSelect = async (data: any, details: any) => {
    if (details?.geometry?.location) {
      const { lat, lng } = details.geometry.location;
      setSelectedLocation({ lat, lng, name: details.name });
      setRecentPosition({ lat, lng });
    }
  };

  useEffect(() => {
    setDistanceSensitivity(range);
    setRecentPosition({ lat: center.latitude, lng: center.longitude });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, center.latitude, center.longitude]);

  const mapRadius = useMemo(() => getRadiusByRangeAndScale(range, countryScale), [range, countryScale]);
  const mapZoom = useMemo(() => getZoomByRangeAndScale(range, countryScale), [range, countryScale]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <CustomProgressBarJoin currentIndex={6} />
      <FixedBottomCTAProvider>
        <StepText
          title={'현재 위치에서 추천받을 여행 반경\n을 선택해주세요'}
          subTitle1={'3. 원하는 반경의 지역을 추천해드려요'}
          subTitle2={'그림은 이해를 돕기 위한 예시이므로 실제 결과와는 \n차이가 있을 수 있어요.'}
        />
        <View style={{ marginHorizontal: 24, marginBottom: 0 }}>
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
              onPress={handlePlaceSelect}
              onFail={(error) => console.log(error)}
              onNotFound={() => console.log('no results')}
            />
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <CustomMapView
            lat={center.latitude}
            lng={center.longitude}
            zoom={mapZoom}
            range={mapRadius}
            style={styles.mapView}
            contentRatio={1}
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: 10, minHeight: 28 }}>
          {loading && <Text>위치를 불러오는 중입니다...</Text>}
          {!loading && error && (
            <Text style={{ color: 'red', marginBottom: 4 }}>{error}</Text>
          )}
          {!loading && !location && !selectedLocation && (
            <Text style={{ color: colors.grey400 }}>
              위치 권한이 없으면 {selectedCountryKo ?? '대한민국'}의 중심을 기준으로 보여집니다.
            </Text>
          )}
        </View>

        <View style={{ marginHorizontal: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: 15, color: colors.grey700 }}>내 근처/선택지역</Text>
            <Text style={{ fontSize: 15, color: colors.grey700 }}>
              {selectedCountryKo ? selectedCountryKo : '한국 전체'}
            </Text>
          </View>
          <Slider
            value={range}
            onChange={handleRangeChange}
            min={1}
            max={10}
            step={1}
            color={colors.green300}
          />
        </View>

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