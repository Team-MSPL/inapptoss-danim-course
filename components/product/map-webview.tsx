import React, { useRef, useState } from "react";
import WebView from "@granite-js/native/react-native-webview";
import { Dimensions, StyleSheet, View, TouchableOpacity } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";

type Props = {
  lat: number;
  lng: number;
  googleApiKey: string; // parent must provide the key (do NOT use import.meta inside)
  zoom?: number;
  range?: number;
  contentRatio?: number;
  // if true (default) user must tap the overlay to enable panning/zooming
  requireActivation?: boolean;
};

export default function MapWebView({
                                     lat,
                                     lng,
                                     googleApiKey,
                                     zoom = 12,
                                     range = 1,
                                     contentRatio = 1,
                                     requireActivation = true,
                                   }: Props) {
  const webRef = useRef<any>(null);
  const [activated, setActivated] = useState(!requireActivation);

  // If no API key, render a visual fallback to avoid runtime errors
  if (!googleApiKey) {
    return <View style={[styles.fallback, { width: styles.webview.width, height: styles.webview.height }]} />;
  }

  // HTML creates a global `map` and an `enableMap` function that RN can call via injectJavaScript.
  // Initial gestureHandling is 'auto' when activated, otherwise 'none' (no drag/zoom).
  const initialGesture = activated ? "auto" : "none";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background: #f6f6f6;
          }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${googleApiKey}"></script>
        <script>
          var map = null;
          function initMap() {
            try {
              const center = { lat: ${lat}, lng: ${lng} };
              map = new google.maps.Map(document.getElementById("map"), {
                center: center,
                zoom: ${zoom},
                disableDefaultUI: true,
                gestureHandling: "${initialGesture}",
              });

              new google.maps.Marker({
                position: center,
                map: map,
              });

              new google.maps.Circle({
                strokeColor: "#2698FB",
                strokeOpacity: 0.15,
                strokeWeight: 1,
                fillColor: "rgba(38, 152, 251, 0.12)",
                fillOpacity: 1,
                map: map,
                center: center,
                radius: ${range * 1500}
              });
            } catch(e) {
              console.error(e);
            }
          }

          // Expose a function to enable gestures after a tap from RN
          window.enableMap = function() {
            try {
              if (map) {
                map.setOptions({ gestureHandling: "auto" });
                // some platforms may need draggable explicitly
                map.setOptions({ draggable: true });
              }
            } catch(e) {
              console.error(e);
            }
          };

          window.onload = initMap;
        </script>
      </head>
      <body>
        <div id="map"></div>
      </body>
    </html>
  `;

  const width = (Dimensions.get("window").width * 327) / 375;
  const height = ((Dimensions.get("window").height * 240) / 812) * contentRatio;

  const handleActivate = () => {
    if (activated) return;
    // call the JS function defined in the webview to enable gestures
    try {
      webRef.current?.injectJavaScript(`(function(){ if(window.enableMap) { window.enableMap(); } })(); true;`);
    } catch (e) {
      // ignore
    }
    setActivated(true);
  };

  return (
    <View style={{ position: "relative" }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={[styles.webview, { width, height }]}
        javaScriptEnabled
        domStorageEnabled
        // ensure touch events still reach RN overlay as needed
        // onMessage can be added later if two-way comm is required
      />

      {/* Overlay shown when not activated (to indicate "tap to enable" UX) */}
      {!activated ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleActivate}
          style={[styles.overlay, { width, height }]}
        >
          <View style={styles.overlayInner}>
            <Text typography="t6" color={colors.teal400} style={styles.overlayText}>
              지도를 탭하여 활성화
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    width: 327,
    height: 240,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f6f6f6",
  },
  fallback: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  overlayInner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    // subtle white pill background so text stands out
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  overlayText: {
    textAlign: "center",
  },
});