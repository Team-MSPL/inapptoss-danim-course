import React from 'react';
import { BottomSheet, Button, colors, Text } from '@toss-design-system/react-native';
import { closeView } from '@apps-in-toss/framework';

type SaveBottomSheetProps = {
  onSave: () => void;
  navigation: any;
  bottomSheet: any;
  isBack: boolean;
};

export function SaveBottomSheet({ onSave, navigation, bottomSheet, isBack }: SaveBottomSheetProps) {
  const getResetRoute = () => {
    if (import.meta.env.APP_START_MODE === '/enroll/title') {
      return '/recommend-product';
    }
    if (import.meta.env.APP_START_MODE === '/Main') {
      return '/Main';
    }
    return '/recommend-product';
  };

  return (
    <>
      <Text
        typography="t4"
        fontWeight="bold"
        color={colors.grey800}
        style={{ alignSelf: 'center', marginTop: 35 }}
      >
        {isBack ? '나가기 전에 일정을 저장할까요?' : '일정을 저장할까요?'}
      </Text>
      <Text
        typography="t5"
        fontWeight="regular"
        color={colors.grey600}
        style={{ textAlign: 'center' }}
      >
        저장된 일정은 '내 여행'에서 볼 수 있어요.
      </Text>
      <BottomSheet.CTA.Double
        leftButton={
          <Button type="dark" style="weak" display="block" onPress={closeView}>
            나가기
          </Button>
        }
        rightButton={
          <Button
            type="primary"
            style="fill"
            display="block"
            onPress={() => {
              bottomSheet.close();
              onSave();
              // IMPORTANT: include fromSave param so recommend-product can detect this flow
              navigation.reset({
                index: 0,
                routes: [{ name: getResetRoute(), params: { fromSave: true } }],
              });
            }}
          >
            저장 후 나가기
          </Button>
        }
      />
    </>
  );
}