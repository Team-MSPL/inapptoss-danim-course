import { useState } from 'react';
import { TimetableItem } from './type';
import { View } from 'react-native';
import { BottomSheet, Button, ListRow, NumericSpinner } from '@toss-design-system/react-native';

type HourBottomSheetContentProps = {
  initialHour?: number;
  onConfirm: (newHour: number) => void;
  onCancel: () => void;
  placeType?: string;
  placeState: TimetableItem;
  maxHour?: number;
};

export function HourBottomSheetContent({
  onConfirm,
  onCancel,
  placeState,
  maxHour = 4,
}: HourBottomSheetContentProps) {
  const [localHour, setLocalHour] = useState<number>(placeState?.takenTime / 60);

  return (
    <View>
      <ListRow
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top={placeState?.name}
            bottom={placeState?.formatted_address}
          />
        }
        right={
          <Button type="dark" size="tiny" style="weak" onPress={onCancel}>
            취소
          </Button>
        }
      />
      <ListRow
        contents={<ListRow.Texts type="1RowTypeA" top="머무를 시간" />}
        right={
          <NumericSpinner
            size="large"
            number={localHour}
            onNumberChange={setLocalHour}
            maxNumber={maxHour}
            minNumber={1}
          />
        }
      />
      <BottomSheet.CTA.Double
        leftButton={
          <Button type="dark" style="weak" display="block" onPress={onCancel}>
            닫기
          </Button>
        }
        rightButton={
          <Button display="block" onPress={() => onConfirm(localHour)}>
            수정 완료
          </Button>
        }
      />
    </View>
  );
}
