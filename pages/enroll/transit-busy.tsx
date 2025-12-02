import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { useAppDispatch, useAppSelector } from 'store';
import { travelSliceActions } from '../../redux/travle-slice';
import { CustomColor } from '../../utill/custom-color';
import { Icon, Text, FixedBottomCTA, FixedBottomCTAProvider, Button, colors } from '@toss-design-system/react-native';

export const Route = createRoute('/enroll/transit-busy', {
  validateParams: (params) => params,
  component: EnrollTransitBusy,
});

export default function EnrollTransitBusy() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { transit, bandwidth } = useAppSelector((s) => s.travelSlice);

  const handleSelectTransit = (idx: number) => {
    dispatch(travelSliceActions.enrollTransit(idx));
  };

  const handleSelectBandwidth = (isRelaxed: boolean) => {
    dispatch(travelSliceActions.enrollBandwidth(isRelaxed));
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text typography="t6" style={styles.sectionTitle}>
          이동수단 선택
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.option, transit === 0 && styles.optionSelected]}
            onPress={() => handleSelectTransit(0)}
            accessibilityLabel="자동차·렌트카 선택"
          >
            <View style={styles.left}>
              <Icon name="icon-car-blue" />
            </View>
            <View style={styles.right}>
              <Text typography="t6" style={[styles.optionText, transit === 0 && styles.optionTextSelected]}>
                자동차·렌트카
              </Text>
              <Text typography="t7" color={colors.grey600} style={styles.optionSub}>
                자유롭게 이동할 수 있어요
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.option, transit === 1 && styles.optionSelected]}
            onPress={() => handleSelectTransit(1)}
            accessibilityLabel="대중교통 선택"
          >
            <View style={styles.left}>
              <Icon name="icon-train-blue" />
            </View>
            <View style={styles.right}>
              <Text typography="t6" style={[styles.optionText, transit === 1 && styles.optionTextSelected]}>
                대중교통
              </Text>
              <Text typography="t7" color={colors.grey600} style={styles.optionSub}>
                대중교통을 이용한 일정이에요
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text typography="t6" style={styles.sectionTitle}>
          일정 성향 선택
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.option, bandwidth === false && styles.optionSelected]}
            onPress={() => handleSelectBandwidth(false)}
            accessibilityLabel="알찬 일정 선택"
          >
            <View style={styles.left}>
              <Image
                source={{ uri: 'https://static.toss.im/2d-emojis/png/4x/u1F3C3.png' }}
                style={styles.iconImage}
              />
            </View>
            <View style={styles.right}>
              <Text typography="t6" style={[styles.optionText, bandwidth === false && styles.optionTextSelected]}>
                알찬 일정
              </Text>
              <Text typography="t7" color={colors.grey600} style={styles.optionSub}>
                더 많은 일정을 채워요
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.option, bandwidth === true && styles.optionSelected]}
            onPress={() => handleSelectBandwidth(true)}
            accessibilityLabel="여유있는 일정 선택"
          >
            <View style={styles.left}>
              <Image
                source={{ uri: 'https://static.toss.im/2d-emojis/png/4x/u1F6B6.png' }}
                style={styles.iconImage}
              />
            </View>
            <View style={styles.right}>
              <Text typography="t6" style={[styles.optionText, bandwidth === true && styles.optionTextSelected]}>
                여유있는 일정
              </Text>
              <Text typography="t7" color={colors.grey600} style={styles.optionSub}>
                쉬는 시간도 포함해요
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const OPTION_HEIGHT = 76;
const ICON_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'column',
    gap: 8,
  },
  option: {
    height: OPTION_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F3F7',
    backgroundColor: CustomColor.ButtonBackground ?? '#FAFAFB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  optionSelected: {
    backgroundColor: 'rgba(195,245,80,0.3)',
    borderColor: '#D7F940',
  },
  left: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  right: {
    flex: 1,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionSub: {
    marginTop: 2,
  },
  iconImage: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    resizeMode: 'contain',
  },
});