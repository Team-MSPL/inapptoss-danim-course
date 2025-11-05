import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createRoute, useNavigation} from '@granite-js/react-native';
import {Button, colors, Text, FixedBottomCTAProvider, Icon} from "@toss-design-system/react-native";

export const Route = createRoute('/reservation/cancel-success', {
  validateParams: (params) => params,
  component: ReservationCancelSuccess,
});

function ReservationCancelSuccess() {
  const navigation = useNavigation();
  const params = Route.useParams();

  function goHome() {
    navigation.reset({ index: 0, routes: [{ name: `/${import.meta.env.APP_START_MODE}` }] });
  }

  return (
    <View style={styles.container}>
      <FixedBottomCTAProvider>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Icon name="icon-check-circle-blue" size={68} color={colors.blue500} />
            </View>
          </View>
          <Text typography="t3" fontWeight="bold">예약이 취소 됐어요</Text>
          <Text typography="t6" color={colors.grey500} style={styles.subtitle}>
            이메일 주소 {params.email} 고객님의{'\n'}예약 확인서를 보내드릴 예정입니다.
          </Text>
          <Button style="weak" size="medium" onPress={goHome} viewStyle={styles.button}>
            <Text typography="t6" fontWeight="bold" style={styles.buttonText}>
              홈으로 돌아가기
            </Text>
          </Button>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    // center content vertically with plenty of top spacing like the image
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 160,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blue500,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 6,
    marginBottom: 8,
    color: colors.grey800,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 20,
    marginTop: 10,
    textAlign: "center",
  },
  button: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: 'center',
  },
  buttonText: {
    color: colors.blue500,
  },
});
