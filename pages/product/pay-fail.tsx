import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createRoute, useNavigation} from '@granite-js/react-native';
import {Button, colors, FixedBottomCTAProvider, Icon, Text} from "@toss-design-system/react-native";

export const Route = createRoute('/product/pay-fail', {
  validateParams: (params) => params,
  component: ProductPayFail,
});

function ProductPayFail() {

  const navigation = useNavigation();

  function goHome() {
    navigation.reset({ index: 0, routes: [{ name: `/${import.meta.env.APP_START_MODE}` }] });
  }

  return (
    <View style={styles.container}>
      <FixedBottomCTAProvider>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Icon name="icon-warning-circle-red" size={68} color={colors.blue500} />
            </View>
          </View>

          <Text typography="t3" fontWeight="bold" style={styles.title}>
            결제 과정에서 문제가 생겼어요
          </Text>

          <Text typography="t6" color={colors.grey500} style={styles.subtitle}>
            재시도, 혹은 문의를 부탁드려요
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
