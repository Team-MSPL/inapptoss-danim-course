import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  FixedBottomCTAProvider,
  Button,
  FixedBottomCTA,
  Text,
  colors,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { StepText } from '../../components/step-text';
// Zustand store import
import { useRegionSearchStore } from "../../zustand/regionSearchStore";
import { CustomProgressBarJoin } from '../../components/join/custom-progress-bar-join';
import RangeSlider from 'rn-range-slider';

export const Route = createRoute('/join/popular', {
  validateParams: (params) => params,
  component: PopularSensitivityScreen,
});

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function getInitialIndexesFromStore(selectPopular?: number[] | null): [number, number] {
  // store keeps percentages [0..100] like [20,80]
  if (!selectPopular || selectPopular.length !== 2) return [2, 4]; // default [40,80] -> indexes 2 and 4 on 0..5 scale
  const low = clamp(Math.round(selectPopular[0] / 20), 0, 5);
  const high = clamp(Math.round(selectPopular[1] / 20), 0, 5);
  // ensure minRange 1 : low < high
  const l = Math.min(low, Math.max(0, high - 1));
  const h = Math.max(high, l + 1);
  return [l, h];
}

export default function PopularSensitivityScreen() {
  const navigation = useNavigation();

  // Zustand usage
  const selectPopular = useRegionSearchStore((state) => state.selectPopular);
  const setSelectPopular = useRegionSearchStore((state) => state.setSelectPopular);

  // local state for the dual-thumb slider values (0..5)
  const [low, setLow] = useState<number>(() => getInitialIndexesFromStore(selectPopular)[0]);
  const [high, setHigh] = useState<number>(() => getInitialIndexesFromStore(selectPopular)[1]);

  // keep last written store pair to avoid unnecessary writes
  const lastWrittenRef = useRef<number[] | null>(null);

  // when store changes externally, reflect into local slider state
  useEffect(() => {
    if (!Array.isArray(selectPopular) || selectPopular.length !== 2) return;
    const [sLow, sHigh] = getInitialIndexesFromStore(selectPopular);
    if (sLow !== low || sHigh !== high) {
      setLow(sLow);
      setHigh(sHigh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectPopular]);

  // sync to zustand when slider values change, but avoid looping by comparing
  useEffect(() => {
    const newPercentPair: [number, number] = [low * 20, high * 20];
    const cur = Array.isArray(selectPopular) && selectPopular.length === 2 ? selectPopular : null;
    const changedFromStore =
      !cur || cur[0] !== newPercentPair[0] || cur[1] !== newPercentPair[1];
    const lastWritten = lastWrittenRef.current;

    if (changedFromStore) {
      // avoid repeatedly writing the same pair
      if (!lastWritten || lastWritten[0] !== newPercentPair[0] || lastWritten[1] !== newPercentPair[1]) {
        setSelectPopular(newPercentPair);
        lastWrittenRef.current = newPercentPair;
      }
    }
    // include selectPopular and low/high in deps to re-evaluate correctly
  }, [low, high, selectPopular, setSelectPopular]);

  // debounce timer ref for "on slide end" logging
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SLIDE_END_DEBOUNCE_MS = 200;

  // helper UI components for RangeSlider rails/thumbs
  const Rail = () => <View style={styles.rail} />;
  const SelectRail = () => <View style={styles.railSelected} />;
  const Thumb = () => (
    <View style={styles.thumb}>
      <View style={styles.thumbInner} />
    </View>
  );

  // Called continuously during sliding; we update local state and schedule a debounced "end" log.
  const handleValueChanged = (newLow: number, newHigh: number) => {
    const l = clamp(Math.round(newLow), 0, 5);
    const h = clamp(Math.round(newHigh), 0, 5);
    // enforce minRange of 1 (library should enforce but double-check)
    if (h - l < 1) return;
    setLow(l);
    setHigh(h);

    // debounce "slide end" console log using captured l,h values
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
    }
    endTimerRef.current = setTimeout(() => {
      console.log('[PopularSensitivityScreen] slider final range (percent):', [l * 20, h * 20]);
      endTimerRef.current = null;
    }, SLIDE_END_DEBOUNCE_MS);
  };

  // navigate
  const goNext = () => {
    navigation.navigate('/join/distance');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <CustomProgressBarJoin currentIndex={5} />
      <FixedBottomCTAProvider>
        <StepText
          title={'가고자 하는 여행지가\n어떤 느낌이었으면 하나요?'}
          subTitle1={'2. 여행지의 인기도를 선택해주세요'}
        />

        <View
          style={{
            backgroundColor: '#F6F7FA',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            marginHorizontal: 30,
            marginBottom: 12,
            marginTop: 20,
          }}
        >
          {[
            ['1. 가장 이색적인', '경남 함안군 등 37개 지역'],
            ['2. 이색적인', '경북 청송군 등 53개 지역'],
            ['3. 매력적인', '강원 화천시 등 32개 지역'],
            ['4. 유명한', '강원 강릉시 등 30개 지역'],
            ['5. 가장 유명한', '서울, 제주 등 10개 지역'],
          ].map(([left, right], i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                marginLeft: 4,
              }}
            >
              <Text typography="t6">{left}</Text>
              <Text typography="t6" color="#8891A7" style={{ marginLeft: 8, flexShrink: 0 }}>
                {right}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginHorizontal: 30 }}>
          {/* Labels above the range slider */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text typography="t5" fontWeight="medium" color={colors.grey700}>
              가장 이색적인
            </Text>
            <Text typography="t5" fontWeight="medium" color={colors.grey700}>
              가장 유명한
            </Text>
          </View>

          {/* Use rn-range-slider with min=0..5 step=1 minRange=1 (dual thumbs) */}
          <RangeSlider
            style={{ width: '100%', height: 70 }}
            min={0}
            max={5}
            step={1}
            minRange={1}
            low={low}
            high={high}
            renderRail={() => <Rail />}
            renderThumb={() => <Thumb />}
            onValueChanged={(newLow: number, newHigh: number) => {
              handleValueChanged(newLow, newHigh);
            }}
            renderRailSelected={() => <SelectRail />}
            disableRange={false}
            thumbRadius={22}
          />
        </View>

        <View style={{ flex: 1 }} />

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
              onPress={goNext}
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
  rail: {
    height: 12,
    width: '100%',
    backgroundColor: '#E5E8EB', // requested background color
    borderRadius: 6,
  },
  railSelected: {
    height: 12,
    width: '100%',
    backgroundColor: '#84FF03', // requested selected color
    borderRadius: 6,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(132,255,3,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInner: {
    width: 24,
    height: 24,
    backgroundColor: '#84FF03',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
});