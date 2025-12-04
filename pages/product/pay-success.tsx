import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import {Text, colors, Icon, FixedBottomCTAProvider, Button} from "@toss-design-system/react-native";

export const Route = createRoute("/product/pay-success", {
  validateParams: (params) => params,
  component: ProductPaySuccess,
});

function ProductPaySuccess() {
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
              <Icon name="icon-check-circle-blue" size={68} color={colors.blue500} />
            </View>
          </View>

          <Text typography="t3" fontWeight="bold" style={styles.title}>
            결제완료 됐어요
          </Text>

          <Text typography="t6" color={colors.grey500} style={styles.subtitle}>
            결제 내역은 내 정보에서 볼 수 있어요
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

export default ProductPaySuccess;