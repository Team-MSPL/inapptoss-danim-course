import { colors, Text, Icon } from '@toss-design-system/react-native';
import { View, TouchableOpacity } from 'react-native';

type MoveTooltipProps = {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
};

export function MoveToolTip({ onMoveUp, onMoveDown, disableUp, disableDown }: MoveTooltipProps) {
  return (
    <View
      style={{
        position: 'absolute',
        right: 30,
        width: 120,
        gap: 10,
        borderRadius: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.grey100,
        padding: 10,
        zIndex: 99,
      }}
    >
      <TouchableOpacity
        onPress={onMoveUp}
        disabled={disableUp}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          opacity: disableUp ? 0.3 : 1,
          marginBottom: 5,
        }}
      >
        <Icon name="icon-chevron-up-mono" size={18} color={colors.grey700} />
        <Text typography="t5" fontWeight="medium" color={colors.grey700} style={{ marginLeft: 8 }}>
          올리기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onMoveDown}
        disabled={disableDown}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          opacity: disableDown ? 0.3 : 1,
        }}
      >
        <Icon name="icon-chevron-down-mono" size={18} color={colors.grey700} />
        <Text typography="t5" fontWeight="medium" color={colors.grey700} style={{ marginLeft: 8 }}>
          내리기
        </Text>
      </TouchableOpacity>
    </View>
  );
}
