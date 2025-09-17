import { colors, ListRow, Text } from '@toss-design-system/react-native';

type PresetTendencyHeaderProps = {
  index: number;
  tendencyList: any[]; // 필요시 더 구체적으로!
  calculateTendency: (obj: any) => string;
};

export function PresetTendencyHeader({
  index,
  tendencyList,
  calculateTendency,
}: PresetTendencyHeaderProps) {
  if (!tendencyList[index]?.tendencyNameList || tendencyList[index].tendencyNameList.length < 2)
    return null;
  return (
    <ListRow
      left={
        <ListRow.Image
          width={24}
          height={24}
          type="default"
          source={{ uri: 'https://static.toss.im/2d-emojis/png/4x/u1F31F.png' }}
        />
      }
      contents={
        <ListRow.Texts
          type="2RowTypeA"
          top={`${index + 1}번 일정`}
          bottom={
            <Text typography="t6" fontWeight="regular" color={colors.grey600}>
              <Text typography="t6" fontWeight="regular" color={colors.blue500}>
                [{calculateTendency(tendencyList[index])}]
              </Text>{' '}
              성향이 높은 일정이에요
            </Text>
          }
          topProps={{ color: colors.grey800 }}
          bottomProps={{ color: colors.grey600 }}
        />
      }
    />
  );
}
