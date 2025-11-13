import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Platform, PixelRatio, Linking, Alert } from "react-native";
import WebView from "@granite-js/native/react-native-webview";
import { colors } from "@toss-design-system/react-native";

type Props = {
  html: string;
  onOpenMedia?: (url: string) => void;
  // optional minimum height to avoid very small containers
  minHeight?: number;
};

/**
 * HtmlRenderer
 * - 기존 고정 200px 높이 WebView를 대체하여 컨텐츠 높이에 맞춰 자동으로 늘어납니다.
 * - 내부 스크롤을 비활성화(scrollEnabled={false})하고, WebView 내부에서 콘텐츠 높이를 측정하여
 *   React Native 쪽 WebView 높이를 조정합니다.
 * - 내부 링크(사용자 클릭)는 외부 브라우저 / 앱으로 열도록 처리합니다 (onOpenMedia 우선 사용).
 *
 * 사용법: 기존 HtmlRenderer를 이 파일로 교체하면 기존 호출부(components/pdml/*)는 변경 없이 동작합니다.
 */
export default function HtmlRenderer({ html, onOpenMedia, minHeight = 60 }: Props) {
  const [height, setHeight] = useState<number>(minHeight);
  const [loading, setLoading] = useState<boolean>(true);
  const webRef = useRef<any>(null);
  const lastHtmlRef = useRef<string>("");

  // The injected script measures document height and posts it to RN.
  // It uses ResizeObserver when available and also hooks image load events.
  const injectedJS = `
    (function () {
      function sendHeight() {
        try {
          var body = document.body, htmlEl = document.documentElement;
          var height = Math.max(
            body.scrollHeight, body.offsetHeight,
            htmlEl.clientHeight, htmlEl.scrollHeight, htmlEl.offsetHeight
          );
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: Math.round(height) }));
        } catch (e) {
          // ignore
        }
      }

      // Normalize body spacing so measured height is consistent
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.body.style.margin = '0';
      document.body.style.padding = '0';

      // Make images responsive so they don't overflow container width
      var style = document.createElement('style');
      style.innerHTML = 'img{max-width:100%;height:auto;display:block;margin:0 auto;} iframe{max-width:100%;}';
      document.head.appendChild(style);

      // Initial send after load
      window.addEventListener('load', function() {
        sendHeight();
      });

      // Use ResizeObserver when present
      if (typeof ResizeObserver !== 'undefined') {
        try {
          var ro = new ResizeObserver(function() { sendHeight(); });
          ro.observe(document.body);
        } catch (e) {
          // fallback to interval
          setInterval(sendHeight, 300);
        }
      } else {
        setInterval(sendHeight, 300);
      }

      // Ensure image load triggers height recalculation
      Array.prototype.forEach.call(document.images, function(img) {
        if (!img.complete) {
          img.addEventListener('load', sendHeight);
          img.addEventListener('error', sendHeight);
        }
      });

      // small delayed check
      setTimeout(sendHeight, 500);
    })();
    true;
  `;

  const buildHtml = useCallback((bodyHtml: string) => {
    // Minimal wrapper with viewport meta and neutral styling to match app text color/spacing
    return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
          <style>
            html,body{margin:0;padding:0;background:transparent;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial;}
            a{color:#1e88e5;word-break:break-word;}
            img{max-width:100%;height:auto;}
            p{margin:0 0 12px 0;line-height:1.45;}
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>`;
  }, []);

  useEffect(() => {
    // If html changes, reset state and trigger reload/remeasure
    if (lastHtmlRef.current !== html) {
      lastHtmlRef.current = html;
      setLoading(true);
      setHeight(minHeight);
      // try to reload to ensure injectedJS runs; some WebView builds require reload
      try {
        if (webRef.current && webRef.current.reload) {
          webRef.current.reload();
        }
      } catch {
        // ignore
      }
    }
  }, [html, minHeight]);

  const onMessage = useCallback(
    (e: any) => {
      try {
        const raw = e?.nativeEvent?.data;
        if (!raw) return;
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (data && data.type === "height" && typeof data.height === "number") {
          const reported = Number(data.height) || 0;
          // On Android the reported height may be in physical pixels; try to normalize.
          const logicalHeight = Platform.OS === "android" ? Math.round(reported / PixelRatio.get()) : reported;
          const final = Math.max(minHeight, logicalHeight);
          setHeight(final);
          setLoading(false);
        }
      } catch {
        // ignore parsing errors
      }
    },
    [minHeight]
  );

  // Intercept navigation requests (user clicked links inside webview).
  // Open externally (or via onOpenMedia) to avoid internal webview navigation inside a small area.
  const handleShouldStartLoadWithRequest = useCallback(
    (req: any) => {
      try {
        const url: string = req?.url ?? "";
        if (!url) return true;
        // allow initial about:blank/data: loads
        if (url === "about:blank") return true;

        // If it's the same document reflow/navigation, allow
        const isMainFrame = req?.target === undefined || req?.isMainFrame === true || req?.mainDocumentURL === undefined;

        // If URL is an http(s) link and not the initial content load, open externally instead of navigating here.
        if (/^https?:\/\//i.test(url)) {
          // prefer onOpenMedia callback
          if (onOpenMedia) {
            try {
              onOpenMedia(url);
            } catch {
              Linking.openURL(url).catch(() => Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다."));
            }
          } else {
            Linking.openURL(url).catch(() => Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다."));
          }
          return false; // block WebView navigation
        }

        // allow other schemes and inline resources
        return true;
      } catch {
        return true;
      }
    },
    [onOpenMedia]
  );

  return (
    <View style={{ backgroundColor: "transparent" }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: buildHtml(html) }}
        injectedJavaScript={injectedJS}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false} // important: disable internal scrolling so container height controls layout
        onMessage={onMessage}
        onLoadEnd={() => {
          // safety: stop loading indicator after small timeout if height not yet reported
          setTimeout(() => setLoading(false), 1000);
        }}
        mixedContentMode="always"
        style={{ height, backgroundColor: "transparent" }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest as any}
      />
      {loading ? (
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.grey400} />
        </View>
      ) : null}
    </View>
  );
}