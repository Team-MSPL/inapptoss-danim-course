import WebView from "@react-native-bedrock/native/react-native-webview";
import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";

export default function CustomMapView({
  lat,
  lng,
  isWideZoom,
  range, // range 값은 숫자
}) {
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
          }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA_nsvAajvyiWj-FeJO6u1-yZYsOBkoPOk"></script>
        <script>
          function initMap() {
            const center = { lat: ${lat}, lng: ${lng} };
            const map = new google.maps.Map(document.getElementById("map"), {
              center: center,
              zoom: ${isWideZoom ? 9 : 12}, // 대략 latitudeDelta 0.8 vs 0.2
              disableDefaultUI: true,
            });

            new google.maps.Circle({
              strokeColor: "#2698FB",
              strokeOpacity: 0,
              strokeWeight: 0,
              fillColor: "rgba(38, 152, 251, 0.3)",
              fillOpacity: 1,
              map: map,
              center: center,
              radius: ${range * (isWideZoom ? 5000 : 1500)}
            });
          }

          window.onload = initMap;
        </script>
      </head>
      <body>
        <div id="map"></div>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      style={styles.container}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: (Dimensions.get("window").width * 327) / 375,
    height: (Dimensions.get("window").height * 240) / 812,
  },
  map: {
    flex: 1,
  },
});
