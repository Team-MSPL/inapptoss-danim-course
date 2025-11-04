import React from "react";
import { View } from "react-native";
import WebView from "@granite-js/native/react-native-webview";

export default function HtmlRenderer({ html }: { html: string }) {
  const wrapped = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial;color:#111827;padding:12px;margin:0">${html}</body></html>`;
  return (
    <View style={{ height: 200, marginTop: 8 }}>
      <WebView originWhitelist={["*"]} source={{ html: wrapped }} javaScriptEnabled domStorageEnabled />
    </View>
  );
}