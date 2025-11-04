import React from "react";
import WebView from "@granite-js/native/react-native-webview";
import { Dimensions, StyleSheet, View } from "react-native";

type Props = {
  lat: number;
  lng: number;
  googleApiKey: string; // parent must provide the key (do NOT use import.meta inside)
  zoom?: number;
  range?: number;
  contentRatio?: number;
};

export default function MapWebView({
                                     lat,
                                     lng,
                                     googleApiKey,
                                     zoom = 12,
                                     range = 1,
                                     contentRatio = 1,
                                   }: Props) {
  // If no API key, render a visual fallback to avoid runtime errors
  if (!googleApiKey) {
    return <View style={[styles.fallback, { width: styles.webview.width, height: styles.webview.height }]} />;
  }

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
          function initMap() {
            try {
              const center = { lat: ${lat}, lng: ${lng} };
              const map = new google.maps.Map(document.getElementById("map"), {
                center: center,
                zoom: ${zoom},
                disableDefaultUI: true,
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

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      style={[styles.webview, { width, height }]}
      javaScriptEnabled
      domStorageEnabled
    />
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
});