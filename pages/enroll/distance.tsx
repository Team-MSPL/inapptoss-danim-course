import { colors, Slider, Text } from '@toss-design-system/react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import CustomMapView from '../../components/map-view';
import { cityViewList } from '../../utill/city-list';
import { useAppSelector, useAppDispatch } from 'store';
import { travelSliceActions } from '../../redux/travle-slice';

export const Route = createRoute('/enroll/distance', {
  validateParams: (params) => params,
  component: EnrollDistance,
});

const ZOOM_STEP = 0.275;
function getZoomByValue(value: number) {
  return 12.5 - (value - 1) * ZOOM_STEP;
}

export function EnrollDistance({ contentRatio = 1 }: { contentRatio?: number }) {
  const dispatch = useAppDispatch();

  const country = useAppSelector((s) => s.travelSlice.country);
  const cityIndex = useAppSelector((s) => s.travelSlice.cityIndex);
  const cityDistance = useAppSelector((s) => s.travelSlice.cityDistance);
  const distanceFromStore = useAppSelector((s) => s.travelSlice.distance);

  const initial = typeof distanceFromStore === 'number' ? distanceFromStore : 5;
  const [value, setValue] = useState<number>(initial);

  const idleTimerRef = useRef<number | null>(null);
  const DISPATCH_DEBOUNCE_MS = 500;

  const handleChange = useCallback((v: number) => {
    setValue(v);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current as unknown as number);
    }
    idleTimerRef.current = (setTimeout(() => {
      dispatch(travelSliceActions.updateFiled({ field: 'distance', value: v }));
      idleTimerRef.current = null;
    }, DISPATCH_DEBOUNCE_MS) as unknown) as number;
  }, [dispatch]);

  useEffect(() => {
    const interacting = Boolean(idleTimerRef.current);
    if (!interacting && typeof distanceFromStore === 'number' && distanceFromStore !== value) {
      setValue(distanceFromStore);
    }
  }, [distanceFromStore, value]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current as unknown as number);
    };
  }, []);

  const lat = cityViewList[country][cityIndex].sub[cityDistance[0]].lat;
  const lng = cityViewList[country][cityIndex].sub[cityDistance[0]].lng;

  return (
    <View style={{ marginHorizontal: 24, justifyContent: 'center' }}>
      <CustomMapView
        lat={lat}
        lng={lng}
        zoom={getZoomByValue(value)}
        range={value}
        contentRatio={contentRatio}
      />
      <View style={{ height: 30 }} />
      <Slider value={value} onChange={handleChange} min={1} max={10} step={1} color={colors.green300} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>내 근처</Text>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>전체</Text>
      </View>
    </View>
  );
}