import WebView from '@granite-js/native/react-native-webview';
import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';

export default function CustomMapView({
  lat,
  lng,
  zoom = 12, // 기본값
  range, // range 값은 숫자
  contentRatio = 1,
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
        <script src="https://maps.googleapis.com/maps/api/js?key=${import.meta.env.GOOGLE_API_KEY}"></script>
        <script>
          function initMap() {
            const center = { lat: ${lat}, lng: ${lng} };
            const map = new google.maps.Map(document.getElementById("map"), {
              center: center,
              zoom: ${zoom},
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
              radius: ${range * 1500}
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
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{
        width: (Dimensions.get('window').width * 327) / 375,
        height: ((Dimensions.get('window').height * 240) / 812) * contentRatio,
      }}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}
