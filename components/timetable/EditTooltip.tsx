import { colors, Text } from '@toss-design-system/react-native';
import { View } from 'react-native';

type EditTooltipProps = {
  showHourBottomSheet: () => void;
  handleRemoveCheck: () => void;
};

export function EditTooltip({ showHourBottomSheet, handleRemoveCheck }: EditTooltipProps) {
  return (
    <View
      style={{
        position: 'absolute',
        right: 30,
        width: 182,
        gap: 10,
        borderRadius: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.grey100,
        padding: 10,
      }}
    >
      <Text
        typography="t5"
        fontWeight="medium"
        color={colors.grey700}
        onPress={showHourBottomSheet}
      >
        편집
      </Text>
      <Text typography="t5" fontWeight="medium" color={colors.grey700} onPress={handleRemoveCheck}>
        삭제
      </Text>
    </View>
  );
}
