import React, { Suspense, lazy } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
const WebView = lazy(() => import('react-native-webview'));
import { colors } from "@toss-design-system/react-native";

export default function PaymentWebViewModal({ visible, checkoutUrl, onRequestClose, onNavigationStateChange, urlConverter }: any) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
      <View style={{ flex: 1 }}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, justifyContent: "space-between", borderBottomWidth: 1, borderColor: colors.grey100 }}>
          <TouchableOpacity onPress={onRequestClose}><Text style={{ color: colors.blue500 }}>닫기</Text></TouchableOpacity>
          <Text>토스 결제</Text>
          <View style={{ width: 40 }} />
        </View>

        {visible && checkoutUrl ? (
          <Suspense fallback={<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text>결제 페이지를 불러오는 중...</Text></View>}>
            <WebView
              originWhitelist={['*']}
              source={{ uri: checkoutUrl }}
              javaScriptEnabled
              domStorageEnabled
              onShouldStartLoadWithRequest={(request: any) => urlConverter(request.url)}
              onNavigationStateChange={onNavigationStateChange}
              startInLoadingState
              mixedContentMode="always"
            />
          </Suspense>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>결제 페이지를 불러오는 중입니다...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}